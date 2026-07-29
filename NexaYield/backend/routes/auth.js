const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Setup default Admin if not exists
const seedAdmin = async () => {
    try {
        const admin = await db.admins.findOne({ where: { email: 'newadmin@test.com' } });
        if (!admin) {
            const hashedPassword = await bcrypt.hash('Admin2026@test', 10);
            await db.admins.create({
                name: 'Super Admin',
                email: 'newadmin@test.com',
                password: hashedPassword,
                role: 'super_admin'
            });
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
        // Check if user already exists
        const existingUser = await db.users.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ error: "Email already in use" });
        
        let referred_by = null;
        
        // Handle referral logic
        if (referral_code) {
            const refUser = await db.users.findOne({ where: { referral_code } });
            if (refUser) {
                referred_by = refUser.id;
            } else {
                return res.status(400).json({ error: "Invalid Referral Code" });
            }
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Generate a unique referral code for the new user
        const newRefCode = 'NY' + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const newUser = await db.users.create({
            name,
            email,
            password: hashedPassword,
            plain_password: password,
            referral_code: newRefCode,
            referred_by
        });
        
        const token = jwt.sign({ id: newUser.id, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({ message: "Registration successful!", token, role: 'user' });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error during registration" });
    }
});

// Login Admin/User
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        // Check Admin
        const admin = await db.admins.findOne({ where: { email } });
        if (admin) {
            const isMatch = await bcrypt.compare(password, admin.password);
            if (isMatch) {
                const token = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '24h' });
                return res.json({ token, role: 'admin', message: "Admin Login Successful" });
            }
        }
        
        // Check User
        const user = await db.users.findOne({ where: { email } });
        if (user) {
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
