const { poolPromise, sql } = require('./backend/config/db');
async function test() {
    const pool = await poolPromise;
    const res = await pool.request().query("SELECT id, next_profit_time FROM user_investments");
    console.log(res.recordset);
    process.exit(0);
}
test();
