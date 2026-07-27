const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Seed default plans
const seedPlans = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT count(*) as cnt FROM PLANS');
        
        if (result.recordset[0].cnt === 0) {
            const plans = [
                { name: 'Basic', amount: 100, daily_percent: 2.5, duration_days: 60 },
                { name: 'Starter', amount: 250, daily_percent: 2.5, duration_days: 60 },
                { name: 'Silver', amount: 500, daily_percent: 2.5, duration_days: 60 },
                { name: 'Gold', amount: 1000, daily_percent: 2.5, duration_days: 60 },
                { name: 'Diamond', amount: 2500, daily_percent: 2.5, duration_days: 60 },
                { name: 'VIP', amount: 5000, daily_percent: 2.5, duration_days: 60 }
            ];
            
            for (let p of plans) {
                await pool.request()
                    .input('name', sql.VarChar, p.name)
                    .input('amount', sql.Decimal(18,2), p.amount)
                    .input('daily_percent', sql.Decimal(5,2), p.daily_percent)
                    .input('duration_days', sql.Int, p.duration_days)
                    .query(`INSERT INTO PLANS (name, amount, daily_percent, duration_days) 
                            VALUES (@name, @amount, @daily_percent, @duration_days)`);
            }
            console.log('✅ Default Plans created');
        }
    } catch (err) {
        console.error('Seed Plans error:', err);
    }
};

seedPlans();

// Get all active plans (Public/User)
router.get('/', async (req, res) => {
    try {
        const pool = await poolPromise;
        const plans = await pool.request()
            .query("SELECT * FROM PLANS WHERE status = 'Active'");
        res.json(plans.recordset);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Admin: Add new plan
router.post('/', verifyToken, isAdmin, async (req, res) => {
    const { name, amount, daily_percent, duration_days } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('amount', sql.Decimal(18,2), amount)
            .input('daily_percent', sql.Decimal(5,2), daily_percent)
            .input('duration_days', sql.Int, duration_days)
            .query(`INSERT INTO PLANS (name, amount, daily_percent, duration_days) 
                    VALUES (@name, @amount, @daily_percent, @duration_days)`);
        res.status(201).json({ message: "Plan created" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

module.exports = router;
