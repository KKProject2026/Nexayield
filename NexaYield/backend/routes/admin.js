const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Admin Dashboard Stats
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const usersCount = await pool.request().query("SELECT COUNT(*) as count FROM USERS");
        const deposits = await pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM DEPOSITS WHERE status = 'Approved'");
        const withdrawals = await pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM WITHDRAWALS WHERE status = 'Paid'");
        
        // Calculate total balances dynamically
        const dailyProfits = await pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM DAILY_PROFITS");
        const refEarnings = await pool.request().query("SELECT ISNULL(SUM(profit_amount), 0) as total FROM REFERRAL_EARNINGS");
        const allWithdrawals = await pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM WITHDRAWALS WHERE status IN ('Paid', 'Pending')");
        
        const totalBalances = (dailyProfits.recordset[0].total + refEarnings.recordset[0].total) - allWithdrawals.recordset[0].total;
        
        res.json({
            totalUsers: usersCount.recordset[0].count,
            totalBalances: totalBalances > 0 ? totalBalances : 0,
            totalDeposits: deposits.recordset[0].total,
            totalWithdrawals: withdrawals.recordset[0].total
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get All Users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT id, name, email, referral_code, wallet_address, status, created_at FROM USERS");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Pending Deposits
router.get('/deposits', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT d.*, u.name, u.email 
            FROM DEPOSITS d 
            JOIN USERS u ON d.user_id = u.id 
            ORDER BY d.created_at DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Approve Deposit
router.post('/deposits/:id/approve', verifyToken, isAdmin, async (req, res) => {
    const depositId = req.params.id;
    
    try {
        const pool = await poolPromise;
        
        // 1. Get deposit info
        const depResult = await pool.request().input('id', sql.Int, depositId).query("SELECT * FROM DEPOSITS WHERE id = @id");
        const deposit = depResult.recordset[0];
        if (!deposit || deposit.status !== 'Pending') return res.status(400).json({ error: "Invalid deposit" });
        
        // 2. Get Plan info based on deposit amount
        const planResult = await pool.request().input('amount', sql.Decimal(18,2), deposit.amount).query("SELECT TOP 1 * FROM PLANS WHERE amount = @amount");
        const plan = planResult.recordset[0];
        if (!plan) return res.status(400).json({ error: "No matching plan found for this deposit amount." });
        
        // 3. Create USER_INVESTMENTS
        const now = new Date();
        const end_date = new Date();
        end_date.setDate(end_date.getDate() + plan.duration_days);
        
        const next_profit_time = new Date();
        next_profit_time.setDate(next_profit_time.getDate() + 1); // 24 hours later
        
        const daily_profit = (plan.amount * plan.daily_percent) / 100;

        const insertInv = await pool.request()
            .input('user_id', sql.Int, deposit.user_id)
            .input('plan_id', sql.Int, plan.id)
            .input('amount', sql.Decimal(18,2), plan.amount)
            .input('daily_profit', sql.Decimal(18,2), daily_profit)
            .input('total_days', sql.Int, plan.duration_days)
            .input('start_date', sql.DateTime, now)
            .input('end_date', sql.DateTime, end_date)
            .input('next_profit_time', sql.DateTime, next_profit_time)
            .query(`INSERT INTO USER_INVESTMENTS 
                    (user_id, plan_id, amount, daily_profit, total_days, start_date, end_date, next_profit_time) 
                    OUTPUT INSERTED.id
                    VALUES (@user_id, @plan_id, @amount, @daily_profit, @total_days, @start_date, @end_date, @next_profit_time)`);
                    
        const newInvId = insertInv.recordset[0].id;
        
        // 4. Update Deposit Status
        await pool.request()
            .input('id', sql.Int, depositId)
            .input('inv_id', sql.Int, newInvId)
            .input('admin_id', sql.Int, req.userId)
            .query("UPDATE DEPOSITS SET status = 'Approved', investment_id = @inv_id, approved_by = @admin_id WHERE id = @id");

        res.json({ message: "Deposit approved and investment started!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Reject Deposit
router.post('/deposits/:id/reject', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('admin_id', sql.Int, req.userId)
            .query("UPDATE DEPOSITS SET status = 'Rejected', approved_by = @admin_id WHERE id = @id");
        res.json({ message: "Deposit rejected" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Withdrawals
router.get('/withdrawals', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT w.*, u.name, u.email 
            FROM WITHDRAWALS w 
            JOIN USERS u ON w.user_id = u.id 
            ORDER BY w.created_at DESC`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Approve Withdrawal
router.post('/withdrawals/:id/approve', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('admin_id', sql.Int, req.userId)
            .query("UPDATE WITHDRAWALS SET status = 'Paid', approved_by = @admin_id WHERE id = @id");
        res.json({ message: "Withdrawal marked as Paid" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Reject Withdrawal
router.post('/withdrawals/:id/reject', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .input('admin_id', sql.Int, req.userId)
            .query("UPDATE WITHDRAWALS SET status = 'Rejected', approved_by = @admin_id WHERE id = @id");
        res.json({ message: "Withdrawal rejected" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Settings
router.get('/settings', verifyToken, isAdmin, async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query("SELECT company_wallet FROM SETTINGS");
        if (result.recordset.length > 0) {
            res.json(result.recordset[0]);
        } else {
            res.json({ company_wallet: '' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update Settings
router.post('/settings', verifyToken, isAdmin, async (req, res) => {
    const { company_wallet } = req.body;
    try {
        const pool = await poolPromise;
        // Check if settings row exists
        const check = await pool.request().query("SELECT id FROM SETTINGS");
        if (check.recordset.length > 0) {
            await pool.request()
                .input('company_wallet', sql.VarChar, company_wallet)
                .query("UPDATE SETTINGS SET company_wallet = @company_wallet");
        } else {
            await pool.request()
                .input('company_wallet', sql.VarChar, company_wallet)
                .query("INSERT INTO SETTINGS (company_wallet) VALUES (@company_wallet)");
        }
        res.json({ message: "Settings updated successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
