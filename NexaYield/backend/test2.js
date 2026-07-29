async function test() {
    const { poolPromise, sql } = require('./backend/config/db');
    try {
        const pool = await poolPromise;
        const usersCount = await pool.request().query("SELECT COUNT(*) as count, ISNULL(SUM(wallet_balance), 0) as totalBalances FROM users WHERE role = 'user'");
        const deposits = await pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM deposits WHERE status = 'Approved'");
        const withdrawals = await pool.request().query("SELECT ISNULL(SUM(amount), 0) as total FROM withdrawals WHERE status = 'Paid'");
        
        console.log("Users:", usersCount.recordset);
        console.log("Deposits:", deposits.recordset);
        console.log("Withdrawals:", withdrawals.recordset);
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
test();
