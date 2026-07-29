const cron = require('node-cron');
const db = require('./config/db');
const { Op } = require('sequelize');

// Run every minute to check for due profits
cron.schedule('* * * * *', async () => {
    try {
        const now = new Date();
        
        // Get due investments
        const dueInvestments = await db.user_investments.findAll({
            where: {
                status: 'Active',
                next_profit_time: { [Op.lte]: now }
            }
        });
            
        for (let inv of dueInvestments) {
            
            // 1. Give User Daily Profit
            await db.daily_profits.create({
                investment_id: inv.id,
                amount: inv.daily_profit,
                status: 'Paid',
                created_at: now
            });
                        
            // 2. Check for Referrer (10% Bonus)
            const user = await db.users.findByPk(inv.user_id);
            const referred_by = user ? user.referred_by : null;
            
            if (referred_by) {
                const refBonus = inv.daily_profit * 0.10; // 10%
                await db.referral_earnings.create({
                    referrer_id: referred_by,
                    referred_user_id: inv.user_id,
                    investment_id: inv.id,
                    profit_amount: refBonus,
                    status: 'Paid',
                    created_at: now
                });
            }
            
            // 3. Update Investment Status
            // Wait, in previous code it used completed_days, but schema has days_passed. Let's fix that.
            const newCompletedDays = (inv.days_passed || 0) + 1;
            let newStatus = 'Active';
            let nextProfitTime = new Date(inv.next_profit_time);
            nextProfitTime.setDate(nextProfitTime.getDate() + 1); // Add 24 hours
            
            if (newCompletedDays >= inv.total_days) {
                newStatus = 'Completed';
            }
            
            await inv.update({
                days_passed: newCompletedDays,
                status: newStatus,
                next_profit_time: nextProfitTime
            });
                        
            console.log(`✅ Processed profit for Investment ID: ${inv.id}`);
        }
    } catch (err) {
        console.error('CRON Error:', err);
    }
});

console.log('⏰ Cron Scheduler Started for Profit Distribution');
