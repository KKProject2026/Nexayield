const { poolPromise, sql } = require('./backend/config/db');

async function insert() {
    try {
        const pool = await poolPromise;
        await pool.request().query("INSERT INTO SETTINGS (company_wallet) VALUES ('TFx123ExampleCompanyWallet999')");
        console.log("Inserted");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
insert();
