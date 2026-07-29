const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Seed predefined plans if they don't exist
const seedPlans = async () => {
    try {
        const cnt = await db.plans.count();
        if (cnt === 0) {
            const initialPlans = [
                { name: 'Basic', amount: 100, daily_percent: 2, duration_days: 60 },
                { name: 'Starter', amount: 250, daily_percent: 2.5, duration_days: 60 },
                { name: 'Silver', amount: 500, daily_percent: 2.5, duration_days: 60 },
                { name: 'Gold', amount: 1000, daily_percent: 2.5, duration_days: 60 },
                { name: 'Diamond', amount: 2500, daily_percent: 2.5, duration_days: 60 },
                { name: 'VIP', amount: 5000, daily_percent: 3, duration_days: 60 }
            ];
            
            for (let p of initialPlans) {
                await db.plans.create({
                    name: p.name,
                    amount: p.amount,
                    daily_percent: p.daily_percent,
                    duration_days: p.duration_days
                });
            }
            console.log('✅ Default Plans Seeded');
        }
    } catch (err) {
        console.error('Seed Plans error:', err);
    }
};

seedPlans();

// Get Active Plans
router.get('/', async (req, res) => {
    try {
        const plans = await db.plans.findAll({
            where: { status: 'Active' },
            order: [['amount', 'ASC']]
        });
        res.json(plans);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching plans" });
    }
});

module.exports = router;
