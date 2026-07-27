const cron = require('node-cron');
const { poolPromise, sql } = require('./config/db');

// Run every minute to check for due profits
cron.schedule('* * * * *', async () => {
    try {
        const pool = await poolPromise;
        const now = new Date();
        
        // Get due investments
        const dueInvestments = await pool.request()
            .input('now', sql.DateTime, now)
            .query("SELECT * FROM USER_INVESTMENTS WHERE status = 'Active' AND next_profit_time <= @now");
            
        for (let inv of dueInvestments.recordset) {
            
            // 1. Give User Daily Profit
            await pool.request()
                .input('investment_id', sql.Int, inv.id)
                .input('amount', sql.Decimal(18,2), inv.daily_profit)
                .input('profit_date', sql.DateTime, now)
                .query(`INSERT INTO DAILY_PROFITS (investment_id, amount, profit_date, status) 
                        VALUES (@investment_id, @amount, @profit_date, 'Paid')`);
                        
            // 2. Check for Referrer (10% Bonus)
            const userRes = await pool.request()
                .input('user_id', sql.Int, inv.user_id)
                .query("SELECT referred_by FROM USERS WHERE id = @user_id");
                
            const referred_by = userRes.recordset[0].referred_by;
            
            if (referred_by) {
                const refBonus = inv.daily_profit * 0.10; // 10%
                await pool.request()
                    .input('referrer_id', sql.Int, referred_by)
                    .input('referred_user_id', sql.Int, inv.user_id)
                    .input('investment_id', sql.Int, inv.id)
                    .input('profit_amount', sql.Decimal(18,2), refBonus)
                    .input('profit_date', sql.DateTime, now)
                    .query(`INSERT INTO REFERRAL_EARNINGS 
                            (referrer_id, referred_user_id, investment_id, profit_amount, profit_date, status)
                            VALUES (@referrer_id, @referred_user_id, @investment_id, @profit_amount, @profit_date, 'Paid')`);
            }
            
            // 3. Update Investment Status
            const newCompletedDays = inv.completed_days + 1;
            let newStatus = 'Active';
            let nextProfitTime = new Date(inv.next_profit_time);
            nextProfitTime.setDate(nextProfitTime.getDate() + 1); // Add 24 hours
            
            if (newCompletedDays >= inv.total_days) {
                newStatus = 'Completed';
            }
            
            await pool.request()
                .input('id', sql.Int, inv.id)
                .input('completed_days', sql.Int, newCompletedDays)
                .input('status', sql.VarChar, newStatus)
                .input('next_profit_time', sql.DateTime, nextProfitTime)
                .query(`UPDATE USER_INVESTMENTS 
                        SET completed_days = @completed_days, status = @status, next_profit_time = @next_profit_time 
                        WHERE id = @id`);
                        
            console.log(`✅ Processed profit for Investment ID: ${inv.id}`);
        }
    } catch (err) {
        console.error('CRON Error:', err);
    }
});

console.log('⏰ Cron Scheduler Started for Profit Distribution');
