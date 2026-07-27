const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

// Get User Dashboard Data
router.get('/dashboard', verifyToken, async (req, res) => {
    if (req.userRole !== 'user') return res.status(403).json({ error: "Only users" });
    
    try {
        const pool = await poolPromise;
        const userId = req.userId;
        
        // Active Investments & Expected Daily Earning
        const invResult = await pool.request()
            .input('user_id', sql.Int, userId)
            .query("SELECT ISNULL(SUM(amount), 0) as total_inv, ISNULL(SUM(daily_profit), 0) as daily_earning FROM USER_INVESTMENTS WHERE user_id = @user_id AND status = 'Active'");
        const totalInvestment = invResult.recordset[0].total_inv;
        const dailyEarning = invResult.recordset[0].daily_earning;

        // Total Daily Profits
        const dailyProfitResult = await pool.request()
            .input('user_id', sql.Int, userId)
            .query(`SELECT ISNULL(SUM(dp.amount), 0) as total_dp 
                    FROM DAILY_PROFITS dp
                    JOIN USER_INVESTMENTS ui ON dp.investment_id = ui.id
                    WHERE ui.user_id = @user_id AND dp.status = 'Paid'`);
        const totalDailyProfit = dailyProfitResult.recordset[0].total_dp;

        // Total Referral Earnings
        const refEarningsResult = await pool.request()
            .input('referrer_id', sql.Int, userId)
            .query("SELECT ISNULL(SUM(profit_amount), 0) as total_ref FROM REFERRAL_EARNINGS WHERE referrer_id = @referrer_id AND status = 'Paid'");
        const totalReferralIncome = refEarningsResult.recordset[0].total_ref;

        // Total Withdrawals (Pending + Paid)
        const withdrawResult = await pool.request()
            .input('user_id', sql.Int, userId)
            .query("SELECT ISNULL(SUM(amount), 0) as total_withdrawn FROM WITHDRAWALS WHERE user_id = @user_id AND status != 'Rejected'");
        const totalWithdrawn = withdrawResult.recordset[0].total_withdrawn;

        // Wallet Balance
        const walletBalance = (totalDailyProfit + totalReferralIncome) - totalWithdrawn;

        // User Data (for referral link etc)
        const userResult = await pool.request()
            .input('id', sql.Int, userId)
            .query("SELECT name, email, referral_code, wallet_address FROM USERS WHERE id = @id");
        const userData = userResult.recordset[0];

        res.json({
            name: userData.name,
            referral_code: userData.referral_code,
            crypto_wallet: userData.wallet_address,
            totalInvestment,
            dailyEarning,
            totalDailyProfit,
            totalReferralIncome,
            walletBalance,
            totalWithdrawn
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching dashboard" });
    }
});

// Update Crypto Wallet
router.post('/wallet', verifyToken, async (req, res) => {
    if (req.userRole !== 'user') return res.status(403).json({ error: "Only users" });
    const { wallet_address } = req.body;
    
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('wallet_address', sql.VarChar, wallet_address)
            .input('id', sql.Int, req.userId)
            .query("UPDATE USERS SET wallet_address = @wallet_address WHERE id = @id");
        res.json({ message: "Wallet updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get User's Investments
router.get('/my-investments', verifyToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user_id', sql.Int, req.userId)
            .query(`
                SELECT i.*, p.name as plan_name, p.amount as plan_amount,
                ISNULL((SELECT SUM(amount) FROM DAILY_PROFITS WHERE investment_id = i.id), 0) as total_earned
                FROM USER_INVESTMENTS i
                JOIN PLANS p ON i.plan_id = p.id
                WHERE i.user_id = @user_id
                ORDER BY i.created_at DESC
            `);
            
        res.json(result.recordset);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});

// Get User's Referrals
router.get('/my-referrals', verifyToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user_id', sql.Int, req.userId)
            .query(`
                SELECT u.name, u.email, u.created_at as joined_date,
                    ISNULL((SELECT SUM(amount) FROM USER_INVESTMENTS WHERE user_id = u.id AND status = 'Active'), 0) as total_invested,
                    ISNULL((SELECT SUM(profit_amount) FROM REFERRAL_EARNINGS WHERE referrer_id = @user_id AND referred_user_id = u.id AND status = 'Paid'), 0) as earned_from_user
                FROM USERS u
                WHERE u.referred_by = @user_id
                ORDER BY u.created_at DESC
            `);
            
        res.json(result.recordset);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});

// Get Company Wallet
router.get('/company-wallet', verifyToken, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT company_wallet FROM SETTINGS");
        if (result.recordset.length > 0) {
            res.json({ company_wallet: result.recordset[0].company_wallet });
        } else {
            res.json({ company_wallet: 'TFx123ExampleCompanyWallet999' });
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});

module.exports = router;
