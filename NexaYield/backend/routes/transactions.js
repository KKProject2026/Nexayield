const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');
const { Op, QueryTypes } = require('sequelize');

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
        const deposits = await db.DEPOSITS.findAll({
            where: { user_id: req.userId },
            attributes: ['amount', 'status', 'created_at'],
            order: [['created_at', 'DESC']]
        });
            
        const withdrawals = await db.WITHDRAWALS.findAll({
            where: { user_id: req.userId },
            attributes: ['amount', 'status', 'created_at'],
            order: [['created_at', 'DESC']]
        });

        res.json({ deposits, withdrawals });
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
        const plan = await db.PLANS.findByPk(plan_id);
        if (!plan) return res.status(400).json({ error: "Invalid Plan" });

        await db.DEPOSITS.create({
            user_id: req.userId,
            amount: amount,
            tx_hash: tx_hash,
            screenshot: screenshot,
            status: 'Pending'
        });
        
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
        // Update user wallet
        await db.USERS.update({ wallet_address }, { where: { id: req.userId } });

        // Calculate Balance
        const dpRes = await db.sequelize.query(`
            SELECT IFNULL(SUM(dp.amount), 0) as amt 
            FROM DAILY_PROFITS dp 
            JOIN USER_INVESTMENTS ui ON dp.investment_id = ui.id 
            WHERE ui.user_id = :userId AND dp.status = 'Paid'
        `, { replacements: { userId: req.userId }, type: QueryTypes.SELECT });
        const totalDailyProfit = parseFloat(dpRes[0].amt) || 0;
        
        const totalReferralIncome = await db.REFERRAL_EARNINGS.sum('profit_amount', { where: { referrer_id: req.userId, status: 'Paid' } }) || 0;
        const totalWithdrawn = await db.WITHDRAWALS.sum('amount', { where: { user_id: req.userId, status: { [Op.ne]: 'Rejected' } } }) || 0;
        const totalMilestoneRewards = await db.MILESTONE_REWARDS.sum('reward_amount', { where: { user_id: req.userId } }) || 0;

        const balance = (totalDailyProfit + totalReferralIncome + totalMilestoneRewards) - totalWithdrawn;

        if (amount > balance) return res.status(400).json({ error: "Insufficient balance" });

        await db.WITHDRAWALS.create({
            user_id: req.userId,
            amount: amount,
            wallet_address: wallet_address,
            status: 'Pending'
        });
                    
        res.status(201).json({ message: "Withdrawal request submitted!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
