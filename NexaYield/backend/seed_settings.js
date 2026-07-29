const { poolPromise, sql } = require('./backend/config/db');

async function seedSettings() {
    try {
        const pool = await poolPromise;
        
        // Create settings table if not exists
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='settings' and xtype='U')
            CREATE TABLE settings (
                id INT IDENTITY(1,1) PRIMARY KEY,
                setting_key VARCHAR(100) UNIQUE NOT NULL,
                setting_value VARCHAR(500) NOT NULL,
                updated_at DATETIME DEFAULT GETDATE()
            )
        `);
        
        // Insert default wallet if not exists
        const check = await pool.request().query("SELECT * FROM settings WHERE setting_key = 'company_wallet'");
        if (check.recordset.length === 0) {
            await pool.request().query("INSERT INTO settings (setting_key, setting_value) VALUES ('company_wallet', 'TFx123ExampleCompanyWallet999')");
            console.log("Inserted default company wallet");
        } else {
            console.log("Company wallet already exists");
        }
        
        console.log("Settings seeded successfully");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedSettings();
