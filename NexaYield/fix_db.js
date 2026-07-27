const { poolPromise, sql } = require('./backend/config/db');

async function fix() {
    try {
        const pool = await poolPromise;
        console.log("Fetching wrong investments...");
        const res = await pool.request().query("SELECT * FROM USER_INVESTMENTS WHERE amount = 100");
        console.log(res.recordset);
        
        // Find which one was supposed to be 5000 based on the DEPOSITS table
        const deps = await pool.request().query("SELECT * FROM DEPOSITS WHERE amount = 5000");
        console.log("Deposits for 5000:", deps.recordset);
        
        if (deps.recordset.length > 0) {
            const badInvId = deps.recordset[0].investment_id;
            console.log("Bad Investment ID to fix:", badInvId);
            
            // Get plan 6 (5000)
            const plan6 = await pool.request().query("SELECT * FROM PLANS WHERE amount = 5000");
            const p6 = plan6.recordset[0];
            
            if (badInvId && p6) {
                const daily_profit = (p6.amount * p6.daily_percent) / 100;
                await pool.request()
                    .input('id', sql.Int, badInvId)
                    .input('plan_id', sql.Int, p6.id)
                    .input('amount', sql.Decimal(18,2), p6.amount)
                    .input('daily_profit', sql.Decimal(18,2), daily_profit)
                    .query("UPDATE USER_INVESTMENTS SET plan_id = @plan_id, amount = @amount, daily_profit = @daily_profit WHERE id = @id");
                console.log("Fixed successfully!");
            }
        }
        process.exit(0);
    } catch(err) {
        console.error(err);
    }
}
fix();
