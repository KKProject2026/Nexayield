const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const { Op, QueryTypes } = require('sequelize');

// Get User Dashboard Data
router.get('/dashboard', verifyToken, async (req, res) => {
    if (req.userRole !== 'user') return res.status(403).json({ error: "Only users" });
    
    try {
        const userId = req.userId;
        
        const totalInvestment = await db.USER_INVESTMENTS.sum('amount', { where: { user_id: userId, status: 'Active' } }) || 0;
        const dailyEarning = await db.USER_INVESTMENTS.sum('daily_profit', { where: { user_id: userId, status: 'Active' } }) || 0;

        const dailyProfitResult = await db.sequelize.query(`
            SELECT IFNULL(SUM(dp.amount), 0) as total_dp 
            FROM DAILY_PROFITS dp
            JOIN USER_INVESTMENTS ui ON dp.investment_id = ui.id
            WHERE ui.user_id = :userId AND dp.status = 'Paid'
        `, { replacements: { userId }, type: QueryTypes.SELECT });
        const totalDailyProfit = parseFloat(dailyProfitResult[0].total_dp) || 0;

        const totalReferralIncome = await db.REFERRAL_EARNINGS.sum('profit_amount', { where: { referrer_id: userId, status: 'Paid' } }) || 0;
        const totalWithdrawn = await db.WITHDRAWALS.sum('amount', { where: { user_id: userId, status: { [Op.ne]: 'Rejected' } } }) || 0;
        const totalMilestoneRewards = await db.MILESTONE_REWARDS.sum('reward_amount', { where: { user_id: userId } }) || 0;

        const walletBalance = (totalDailyProfit + totalReferralIncome + totalMilestoneRewards) - totalWithdrawn;

        const userData = await db.USERS.findByPk(userId);

        res.json({
            name: userData.name,
            referral_code: userData.referral_code,
            crypto_wallet: userData.wallet_address,
            totalInvestment,
            dailyEarning,
            totalDailyProfit,
            totalReferralIncome,
            walletBalance,
            totalWithdrawn,
            totalMilestoneRewards
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
        await db.USERS.update({ wallet_address }, { where: { id: req.userId } });
        res.json({ message: "Wallet updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get User's Investments
router.get('/my-investments', verifyToken, async (req, res) => {
    try {
        const result = await db.sequelize.query(`
            SELECT i.*, p.name as plan_name, p.amount as plan_amount,
            IFNULL((SELECT SUM(amount) FROM DAILY_PROFITS WHERE investment_id = i.id), 0) as total_earned
            FROM USER_INVESTMENTS i
            JOIN PLANS p ON i.plan_id = p.id
            WHERE i.user_id = :userId
            ORDER BY i.created_at DESC
        `, { replacements: { userId: req.userId }, type: QueryTypes.SELECT });
            
        res.json(result);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});

// Get User's Referrals
router.get('/my-referrals', verifyToken, async (req, res) => {
    try {
        const result = await db.sequelize.query(`
            SELECT u.name, u.email, u.created_at as joined_date,
                IFNULL((SELECT SUM(amount) FROM USER_INVESTMENTS WHERE user_id = u.id AND status = 'Active'), 0) as total_invested,
                IFNULL((SELECT SUM(profit_amount) FROM REFERRAL_EARNINGS WHERE referrer_id = :userId AND referred_user_id = u.id AND status = 'Paid'), 0) as earned_from_user
            FROM USERS u
            WHERE u.referred_by = :userId
            ORDER BY u.created_at DESC
        `, { replacements: { userId: req.userId }, type: QueryTypes.SELECT });
            
        res.json(result);
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});

// Get Company Wallet
router.get('/company-wallet', verifyToken, async (req, res) => {
    try {
        const settings = await db.SETTINGS.findOne();
        if (settings) {
            res.json({ company_wallet: settings.company_wallet, company_qr: settings.company_qr });
        } else {
            res.json({ company_wallet: 'TFx123ExampleCompanyWallet999', company_qr: null });
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({error: "Server error"});
    }
});

module.exports = router;
