const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Initialize DB connection
require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));
// Serve uploaded screenshots
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes mapping
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const transactionRoutes = require('./routes/transactions');
const planRoutes = require('./routes/plans');
const supportRoutes = require('./routes/support');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/support', supportRoutes);

// Initialize Cron Jobs
require('./cron');

// Fallback to index.html for unknown routes (SPA like behavior)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
