async function test() {
    const { poolPromise, sql } = require('./backend/config/db');
    try {
        const pool = await poolPromise;
        const res = await pool.request().query("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'USERS'");
        console.log(res.recordset);
    } catch(err) {
        console.error(err);
    }
    process.exit(0);
}
test();
