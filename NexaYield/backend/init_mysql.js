const mysql = require('mysql2/promise');

require('dotenv').config();

async function initDb() {
    try {
        const dbHost = process.env.DB_SERVER || '127.0.0.1';
        const dbUser = process.env.DB_USER || 'root';
        const dbPass = process.env.DB_PASS || '';
        const dbName = process.env.DB_NAME || 'earnkk';

        // Connect without database first to create it
        const connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPass
        });

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
        console.log(`Database '${dbName}' ensured.`);
        
        // Connect to the new database
        await connection.changeUser({ database: dbName });

        const tables = [
            `CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                role VARCHAR(50) DEFAULT 'admin'
            )`,
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                plain_password VARCHAR(255),
                referral_code VARCHAR(50) UNIQUE,
                referred_by INT NULL,
                wallet_address VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS settings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                company_wallet VARCHAR(255),
                company_qr VARCHAR(255)
            )`,
            `CREATE TABLE IF NOT EXISTS plans (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255),
                amount DECIMAL(18,2),
                daily_percent DECIMAL(5,2),
                duration_days INT,
                status VARCHAR(50) DEFAULT 'Active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS deposits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                amount DECIMAL(18,2),
                tx_hash VARCHAR(255),
                screenshot VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Pending',
                investment_id INT NULL,
                approved_by INT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS user_investments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                plan_id INT,
                amount DECIMAL(18,2),
                daily_profit DECIMAL(18,2),
                total_days INT,
                days_passed INT DEFAULT 0,
                start_date DATETIME,
                end_date DATETIME,
                next_profit_time DATETIME,
                status VARCHAR(50) DEFAULT 'Active',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS daily_profits (
                id INT AUTO_INCREMENT PRIMARY KEY,
                investment_id INT,
                amount DECIMAL(18,2),
                status VARCHAR(50) DEFAULT 'Paid',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS withdrawals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                amount DECIMAL(18,2),
                wallet_address VARCHAR(255),
                status VARCHAR(50) DEFAULT 'Pending',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS referral_earnings (
                id INT AUTO_INCREMENT PRIMARY KEY,
                referrer_id INT,
                referred_user_id INT,
                investment_id INT,
                profit_amount DECIMAL(18,2),
                status VARCHAR(50) DEFAULT 'Paid',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS milestone_rewards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                milestone_amount DECIMAL(18,2),
                reward_amount DECIMAL(18,2),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS SUPPORT_MESSAGES (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT,
                sender VARCHAR(50) DEFAULT 'user',
                message TEXT,
                is_read BOOLEAN DEFAULT FALSE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (let query of tables) {
            await connection.query(query);
        }

        console.log("All tables created successfully!");

        // Insert initial Settings and Plans if empty
        const [settings] = await connection.query("SELECT * FROM settings");
        if (settings.length === 0) {
            await connection.query("INSERT INTO settings (company_wallet) VALUES ('0xDefaultCompanyWalletAddress')");
        }

        const [plans] = await connection.query("SELECT * FROM plans");
        if (plans.length === 0) {
            const initialPlans = [
                { name: 'Basic', amount: 100, daily: 2, duration: 60 },
                { name: 'Starter', amount: 250, daily: 2.5, duration: 60 },
                { name: 'Silver', amount: 500, daily: 2.5, duration: 60 },
                { name: 'Gold', amount: 1000, daily: 2.5, duration: 60 },
                { name: 'Diamond', amount: 2500, daily: 2.5, duration: 60 },
                { name: 'VIP', amount: 5000, daily: 3, duration: 60 }
            ];
            for (let p of initialPlans) {
                await connection.query("INSERT INTO plans (name, amount, daily_percent, duration_days) VALUES (?, ?, ?, ?)", [p.name, p.amount, p.daily, p.duration]);
            }
            console.log("Default plans seeded.");
        }

        await connection.end();
        process.exit(0);
    } catch (err) {
        console.error("Migration Error:", err);
        process.exit(1);
    }
}

initDb();
