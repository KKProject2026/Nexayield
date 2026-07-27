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
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/transactions', require('./routes/transactions'));

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
