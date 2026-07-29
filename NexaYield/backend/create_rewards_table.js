const { poolPromise } = require('./backend/config/db');

async function createTable() {
    try {
        const pool = await poolPromise;
        const query = `
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='milestone_rewards' and xtype='U')
            BEGIN
                CREATE TABLE milestone_rewards (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    user_id INT NOT NULL,
                    milestone_amount DECIMAL(18,2) NOT NULL,
                    reward_amount DECIMAL(18,2) NOT NULL,
                    created_at DATETIME DEFAULT GETDATE()
                )
                PRINT 'Table milestone_rewards created.'
            END
            ELSE
            BEGIN
                PRINT 'Table milestone_rewards already exists.'
            END
        `;
        await pool.request().query(query);
        console.log("Database updated successfully.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
createTable();
