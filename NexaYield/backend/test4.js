const { poolPromise, sql } = require('./backend/config/db');
async function test() {
    const pool = await poolPromise;
    const res = await pool.request().query(`
                SELECT i.*, p.name as plan_name, p.amount as plan_amount,
                ISNULL((SELECT SUM(amount) FROM daily_profits WHERE investment_id = i.id), 0) as total_earned
                FROM user_investments i
                JOIN plans p ON i.plan_id = p.id
    `);
    console.log(JSON.stringify(res.recordset, null, 2));
    process.exit(0);
}
test();
