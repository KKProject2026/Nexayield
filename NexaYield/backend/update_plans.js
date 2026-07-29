const { poolPromise, sql } = require('./backend/config/db');

async function updatePlans() {
    try {
        const pool = await poolPromise;
        await pool.request().query("UPDATE plans SET name = 'Basic' WHERE amount = 100");
        await pool.request().query("UPDATE plans SET name = 'Starter' WHERE amount = 250");
        await pool.request().query("UPDATE plans SET name = 'Silver' WHERE amount = 500");
        await pool.request().query("UPDATE plans SET name = 'Gold' WHERE amount = 1000");
        await pool.request().query("UPDATE plans SET name = 'Diamond' WHERE amount = 2500");
        await pool.request().query("UPDATE plans SET name = 'VIP' WHERE amount = 5000");
        console.log("Plan names updated!");
        process.exit(0);
    } catch(err) {
        console.error(err);
    }
}
updatePlans();
