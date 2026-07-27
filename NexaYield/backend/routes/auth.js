const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { poolPromise, sql } = require('../config/db');

// Setup default Admin if not exists
const seedAdmin = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('email', sql.VarChar, 'newadmin@test.com')
            .query('SELECT * FROM ADMINS WHERE email = @email');
            
        if (result.recordset.length === 0) {
            const hashedPassword = await bcrypt.hash('Admin2026@test', 10);
            await pool.request()
                .input('name', sql.VarChar, 'Super Admin')
                .input('email', sql.VarChar, 'newadmin@test.com')
                .input('password', sql.VarChar, hashedPassword)
                .input('role', sql.VarChar, 'super_admin')
                .query(`INSERT INTO ADMINS (name, email, password, role) VALUES (@name, @email, @password, @role)`);
            console.log('✅ Default Admin created: newadmin@test.com');
        }
    } catch (err) {
        console.error('Seed Admin error:', err);
    }
};

seedAdmin();

// Register User
router.post('/register', async (req, res) => {
    const { name, email, password, referral_code } = req.body;
    
    try {
        const pool = await poolPromise;
        
        // Check if user already exists
        const userCheck = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT id FROM USERS WHERE email = @email');
            
        if (userCheck.recordset.length > 0) {
            return res.status(400).json({ error: "Email already registered" });
        }

        // Handle Referral
        let referred_by = null;
        if (referral_code) {
            const refCheck = await pool.request()
                .input('referral_code', sql.VarChar, referral_code)
                .query('SELECT id FROM USERS WHERE referral_code = @referral_code');
            
            if (refCheck.recordset.length > 0) {
                referred_by = refCheck.recordset[0].id;
            } else {
                return res.status(400).json({ error: "Invalid Referral Code" });
            }
        }

        // Generate own referral code (simple random string)
        const own_referral_code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const result = await pool.request()
            .input('name', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('referral_code', sql.VarChar, own_referral_code)
            .input('referred_by', sql.Int, referred_by)
            .query(`INSERT INTO USERS (name, email, password, referral_code, referred_by) 
                    OUTPUT INSERTED.id
                    VALUES (@name, @email, @password, @referral_code, @referred_by)`);
                    
        const userId = result.recordset[0].id;
        const token = jwt.sign({ id: userId, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '24h' });
                    
        res.status(201).json({ message: "Registration successful!", token, role: 'user' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

// Login (Checks Admin then User)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const pool = await poolPromise;
        
        // 1. Check Admin
        const adminCheck = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM ADMINS WHERE email = @email');
            
        if (adminCheck.recordset.length > 0) {
            const admin = adminCheck.recordset[0];
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
                return res.json({ token, role: 'admin', message: "Admin Login Successful" });
            }
        }
        
        // 2. Check User
        const userCheck = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM USERS WHERE email = @email');
            
        if (userCheck.recordset.length > 0) {
            const user = userCheck.recordset[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '24h' });
                return res.json({ token, role: 'user', message: "Login Successful" });
            }
        }
        
        return res.status(401).json({ error: "Invalid Email or Password" });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during login" });
    }
});

module.exports = router;
