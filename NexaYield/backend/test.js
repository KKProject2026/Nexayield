async function test() {
    const { poolPromise, sql } = require('./backend/config/db');
    try {
        const pool = await poolPromise;
        const res = await pool.request()
            .input('user_id', sql.Int, 1)
            .query(`
                SELECT i.*, p.name as plan_name, p.amount as plan_amount,
                ISNULL((SELECT SUM(amount) FROM daily_profits WHERE investment_id = i.id), 0) as total_earned
                FROM user_investments i
                JOIN plans p ON i.plan_id = p.id
                WHERE i.user_id = @user_id
                ORDER BY i.created_at DESC
            `);
        console.log(res.recordset);
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
test();
