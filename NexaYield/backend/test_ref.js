const { poolPromise } = require('./backend/config/db');

async function test() {
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='REFERRAL_EARNINGS'");
        console.log(res.recordset);
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
test();
