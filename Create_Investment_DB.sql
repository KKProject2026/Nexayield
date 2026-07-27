CREATE DATABASE InvestmentPlatform;
GO

USE InvestmentPlatform;
GO

-- =============================================
-- Independent Tables (No Foreign Keys pointing to them yet)
-- =============================================

CREATE TABLE SETTINGS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_wallet VARCHAR(255),
    minimum_withdraw DECIMAL(18,2),
    withdraw_interval INT,
    referral_percent DECIMAL(5,2),
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE ADMINS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active'
);

CREATE TABLE PLANS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    daily_percent DECIMAL(5,2) NOT NULL,
    duration_days INT NOT NULL,
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT GETDATE()
);

CREATE TABLE USERS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    referral_code VARCHAR(50) UNIQUE,
    referred_by INT NULL, -- Self reference to the USERS table
    wallet_address VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Users_ReferredBy FOREIGN KEY (referred_by) REFERENCES USERS(id)
);

-- =============================================
-- Dependent Tables (Contain Foreign Keys)
-- =============================================

CREATE TABLE USER_INVESTMENTS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    daily_profit DECIMAL(18,2) NOT NULL,
    total_days INT NOT NULL,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    next_profit_time DATETIME,
    completed_days INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'Active',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Investments_User FOREIGN KEY (user_id) REFERENCES USERS(id),
    CONSTRAINT FK_Investments_Plan FOREIGN KEY (plan_id) REFERENCES PLANS(id)
);

CREATE TABLE DAILY_PROFITS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    investment_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    profit_date DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Paid',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_DailyProfits_Investment FOREIGN KEY (investment_id) REFERENCES USER_INVESTMENTS(id)
);

CREATE TABLE DEPOSITS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    investment_id INT NULL,
    amount DECIMAL(18,2) NOT NULL,
    tx_hash VARCHAR(255),
    screenshot VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Pending',
    admin_remark VARCHAR(255),
    approved_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Deposits_User FOREIGN KEY (user_id) REFERENCES USERS(id),
    CONSTRAINT FK_Deposits_Investment FOREIGN KEY (investment_id) REFERENCES USER_INVESTMENTS(id),
    CONSTRAINT FK_Deposits_Admin FOREIGN KEY (approved_by) REFERENCES ADMINS(id)
);

CREATE TABLE WITHDRAWALS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(18,2) NOT NULL,
    wallet_address VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending',
    admin_remark VARCHAR(255),
    approved_by INT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_Withdrawals_User FOREIGN KEY (user_id) REFERENCES USERS(id),
    CONSTRAINT FK_Withdrawals_Admin FOREIGN KEY (approved_by) REFERENCES ADMINS(id)
);

CREATE TABLE REFERRAL_EARNINGS (
    id INT IDENTITY(1,1) PRIMARY KEY,
    referrer_id INT NOT NULL,
    referred_user_id INT NOT NULL,
    investment_id INT NULL,
    profit_amount DECIMAL(18,2) NOT NULL,
    profit_date DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'Paid',
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_RefEarnings_Referrer FOREIGN KEY (referrer_id) REFERENCES USERS(id),
    CONSTRAINT FK_RefEarnings_ReferredUser FOREIGN KEY (referred_user_id) REFERENCES USERS(id),
    CONSTRAINT FK_RefEarnings_Investment FOREIGN KEY (investment_id) REFERENCES USER_INVESTMENTS(id)
);
