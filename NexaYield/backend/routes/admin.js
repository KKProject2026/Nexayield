const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { Op, QueryTypes } = require('sequelize');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for QR code uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, 'qr_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Admin Dashboard Stats
router.get('/dashboard', verifyToken, isAdmin, async (req, res) => {
    try {
        const usersCount = await db.USERS.count();
        const totalDeposits = await db.DEPOSITS.sum('amount', { where: { status: 'Approved' } }) || 0;
        const withdrawalsPaid = await db.WITHDRAWALS.sum('amount', { where: { status: 'Paid' } }) || 0;
        
        const dailyProfits = await db.DAILY_PROFITS.sum('amount') || 0;
        const refEarnings = await db.REFERRAL_EARNINGS.sum('profit_amount') || 0;
        const allWithdrawals = await db.WITHDRAWALS.sum('amount', { where: { status: { [Op.in]: ['Paid', 'Pending'] } } }) || 0;
        
        const totalBalances = (dailyProfits + refEarnings) - allWithdrawals;
        
        res.json({
            totalUsers: usersCount,
            totalBalances: totalBalances > 0 ? totalBalances : 0,
            totalDeposits: totalDeposits,
            totalWithdrawals: withdrawalsPaid
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get All Users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const users = await db.USERS.findAll({
            attributes: ['id', 'name', 'email', 'referral_code', 'wallet_address', 'status', 'created_at']
        });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Pending Deposits
router.get('/deposits', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await db.sequelize.query(`
            SELECT d.*, u.name, u.email 
            FROM DEPOSITS d 
            JOIN USERS u ON d.user_id = u.id 
            ORDER BY d.created_at DESC`, { type: QueryTypes.SELECT });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Approve Deposit
router.post('/deposits/:id/approve', verifyToken, isAdmin, async (req, res) => {
    const depositId = req.params.id;
    
    try {
        const deposit = await db.DEPOSITS.findByPk(depositId);
        if (!deposit || deposit.status !== 'Pending') return res.status(400).json({ error: "Invalid deposit" });
        
        // Ensure user is loaded
        const user = await db.USERS.findByPk(deposit.user_id);
        
        const planResult = await db.sequelize.query("SELECT * FROM PLANS WHERE amount = :amount LIMIT 1", {
            replacements: { amount: deposit.amount }, type: QueryTypes.SELECT
        });
        const plan = planResult[0];
        if (!plan) return res.status(400).json({ error: "No matching plan found for this deposit amount." });
        
        const now = new Date();
        const end_date = new Date();
        end_date.setDate(end_date.getDate() + plan.duration_days);
        
        const next_profit_time = new Date();
        next_profit_time.setDate(next_profit_time.getDate() + 1);
        
        const daily_profit = (plan.amount * plan.daily_percent) / 100;

        const newInv = await db.USER_INVESTMENTS.create({
            user_id: deposit.user_id,
            plan_id: plan.id,
            amount: plan.amount,
            daily_profit: daily_profit,
            total_days: plan.duration_days,
            start_date: now,
            end_date: end_date,
            next_profit_time: next_profit_time
        });
        
        await deposit.update({
            status: 'Approved',
            investment_id: newInv.id,
            approved_by: req.userId
        });

        if (user && user.referred_by) {
            const volumeRes = await db.sequelize.query(`
                SELECT IFNULL(SUM(ui.amount), 0) as total_volume
                FROM USER_INVESTMENTS ui
                JOIN USERS u ON ui.user_id = u.id
                WHERE u.referred_by = :referrer_id AND ui.status = 'Active'
            `, { replacements: { referrer_id: user.referred_by }, type: QueryTypes.SELECT });
            
            const totalVolume = parseFloat(volumeRes[0].total_volume);

            const milestones = [
                { volume: 10000, reward: 50 },
                { volume: 20000, reward: 100 },
                { volume: 50000, reward: 1000 }
            ];

            for (let ms of milestones) {
                if (totalVolume >= ms.volume) {
                    const checkRes = await db.MILESTONE_REWARDS.findOne({
                        where: { user_id: user.referred_by, milestone_amount: ms.volume }
                    });
                    
                    if (!checkRes) {
                        await db.MILESTONE_REWARDS.create({
                            user_id: user.referred_by,
                            milestone_amount: ms.volume,
                            reward_amount: ms.reward
                        });
                    }
                }
            }
        }

        res.json({ message: "Deposit approved and investment started!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// Reject Deposit
router.post('/deposits/:id/reject', verifyToken, isAdmin, async (req, res) => {
    try {
        const deposit = await db.DEPOSITS.findByPk(req.params.id);
        if (deposit) {
            await deposit.update({ status: 'Rejected', approved_by: req.userId });
        }
        res.json({ message: "Deposit rejected" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Withdrawals
router.get('/withdrawals', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await db.sequelize.query(`
            SELECT w.*, u.name, u.email 
            FROM WITHDRAWALS w 
            JOIN USERS u ON w.user_id = u.id 
            ORDER BY w.created_at DESC`, { type: QueryTypes.SELECT });
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Approve Withdrawal
router.post('/withdrawals/:id/approve', verifyToken, isAdmin, async (req, res) => {
    try {
        const w = await db.WITHDRAWALS.findByPk(req.params.id);
        if (w) await w.update({ status: 'Paid' });
        res.json({ message: "Withdrawal approved" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Reject Withdrawal
router.post('/withdrawals/:id/reject', verifyToken, isAdmin, async (req, res) => {
    try {
        const w = await db.WITHDRAWALS.findByPk(req.params.id);
        if (w) await w.update({ status: 'Rejected' });
        res.json({ message: "Withdrawal rejected" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Get Settings
router.get('/settings', verifyToken, isAdmin, async (req, res) => {
    try {
        const setting = await db.SETTINGS.findOne();
        res.json(setting || {});
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Update Settings
router.post('/settings', verifyToken, isAdmin, async (req, res) => {
    try {
        const { company_wallet } = req.body;
        const setting = await db.SETTINGS.findOne();
        if (setting) {
            await setting.update({ company_wallet });
        } else {
            await db.SETTINGS.create({ company_wallet });
        }
        res.json({ message: "Settings updated successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Upload Settings QR
router.post('/settings/qr', verifyToken, isAdmin, upload.single('qr_image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        
        const filePath = '/uploads/' + req.file.filename;
        const setting = await db.SETTINGS.findOne();
        
        if (setting) {
            await setting.update({ company_qr: filePath });
        } else {
            await db.SETTINGS.create({ company_qr: filePath });
        }
        
        res.json({ message: "QR Code uploaded successfully", company_qr: filePath });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
