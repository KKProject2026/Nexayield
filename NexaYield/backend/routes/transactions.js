const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { poolPromise, sql } = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Multer Config
const storage = multer.diskStorage({
    destination: './backend/uploads/',
    filename: (req, file, cb) => {
        cb(null, 'deposit-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// User: Get Transaction History
router.get('/history', verifyToken, async (req, res) => {
    if (req.userRole !== 'user') return res.status(403).json({ error: "Only users" });
    try {
        const pool = await poolPromise;
        const deposits = await pool.request()
            .input('user_id', sql.Int, req.userId)
            .query("SELECT amount, status, created_at FROM DEPOSITS WHERE user_id = @user_id ORDER BY created_at DESC");
            
        const withdrawals = await pool.request()
            .input('user_id', sql.Int, req.userId)
            .query("SELECT amount, status, created_at FROM WITHDRAWALS WHERE user_id = @user_id ORDER BY created_at DESC");

        res.json({
            deposits: deposits.recordset,
            withdrawals: withdrawals.recordset
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// User: Create Deposit
router.post('/deposit', verifyToken, upload.single('screenshot'), async (req, res) => {
    if (req.userRole !== 'user') return res.status(403).json({ error: "Only users" });
    const { plan_id, amount, tx_hash } = req.body;
    const screenshot = req.file ? `/uploads/${req.file.filename}` : null;
    
    if (!screenshot || !tx_hash) return res.status(400).json({ error: "Screenshot and TX Hash are required" });

    try {
        const pool = await poolPromise;
        // Verify Plan
        const planResult = await pool.request()
            .input('id', sql.Int, plan_id)
            .query("SELECT * FROM PLANS WHERE id = @id");
        if (planResult.recordset.length === 0) return res.status(400).json({ error: "Invalid Plan" });

        await pool.request()
            .input('user_id', sql.Int, req.userId)
            .input('amount', sql.Decimal(18,2), amount)
            .input('tx_hash', sql.VarChar, tx_hash)
            .input('screenshot', sql.VarChar, screenshot)
            .query(`INSERT INTO DEPOSITS (user_id, amount, tx_hash, screenshot, status) 
                    VALUES (@user_id, @amount, @tx_hash, @screenshot, 'Pending')`);
        
        res.status(201).json({ message: "Deposit submitted for approval!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// User: Request Withdrawal
router.post('/withdraw', verifyToken, async (req, res) => {
    if (req.userRole !== 'user') return res.status(403).json({ error: "Only users" });
    const { amount, wallet_address } = req.body;
    
    if (amount < 10) return res.status(400).json({ error: "Minimum withdrawal is 10 USDT" });
    if (!wallet_address) return res.status(400).json({ error: "Please enter your wallet address." });

    try {
        const pool = await poolPromise;
        
        // Optionally update the user's saved wallet if they provided a new one
        await pool.request()
            .input('id', sql.Int, req.userId)
            .input('wallet_address', sql.VarChar, wallet_address)
            .query("UPDATE USERS SET wallet_address = @wallet_address WHERE id = @id");

        // Calculate Balance
        const dpRes = await pool.request()
            .input('user_id', sql.Int, req.userId)
            .query(`SELECT ISNULL(SUM(dp.amount), 0) as amt FROM DAILY_PROFITS dp JOIN USER_INVESTMENTS ui ON dp.investment_id = ui.id WHERE ui.user_id = @user_id AND dp.status = 'Paid'`);
        
        const refRes = await pool.request()
            .input('user_id', sql.Int, req.userId)
            .query(`SELECT ISNULL(SUM(profit_amount), 0) as amt FROM REFERRAL_EARNINGS WHERE referrer_id = @user_id AND status = 'Paid'`);
            
        const wRes = await pool.request()
            .input('user_id', sql.Int, req.userId)
            .query(`SELECT ISNULL(SUM(amount), 0) as amt FROM WITHDRAWALS WHERE user_id = @user_id AND status != 'Rejected'`);
            
        const balance = (dpRes.recordset[0].amt + refRes.recordset[0].amt) - wRes.recordset[0].amt;

        if (amount > balance) return res.status(400).json({ error: "Insufficient balance" });

        await pool.request()
            .input('user_id', sql.Int, req.userId)
            .input('amount', sql.Decimal(18,2), amount)
            .input('wallet_address', sql.VarChar, wallet_address)
            .query(`INSERT INTO WITHDRAWALS (user_id, amount, wallet_address, status) 
                    VALUES (@user_id, @amount, @wallet_address, 'Pending')`);
                    
        res.status(201).json({ message: "Withdrawal request submitted!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
