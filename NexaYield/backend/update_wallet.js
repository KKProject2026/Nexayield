const { poolPromise, sql } = require('./backend/config/db');

async function updateWallet() {
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('wallet', sql.VarChar, '0xb469e58FB851700058f3755a4CBE00dA584bf388')
            .query("UPDATE settings SET company_wallet = @wallet");
        console.log("Wallet updated successfully!");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
updateWallet();
