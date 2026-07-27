const { poolPromise } = require('./backend/config/db');

async function update() {
    try {
        const pool = await poolPromise;
        await pool.request().query("UPDATE PLANS SET daily_percent = 2 WHERE name = 'Basic'");
        await pool.request().query("UPDATE PLANS SET daily_percent = 3 WHERE name = 'VIP'");
        console.log("Plans updated successfully!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
update();
