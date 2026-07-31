const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const { QueryTypes } = require('sequelize');

// USER: Get my chat history
router.get('/', verifyToken, async (req, res) => {
    try {
        const result = await db.sequelize.query(`
            SELECT * FROM support_messages 
            WHERE user_id = :userId 
            ORDER BY created_at ASC
        `, { replacements: { userId: req.userId }, type: QueryTypes.SELECT });
        
        // Mark as read when user fetches messages
        await db.sequelize.query(`
            UPDATE support_messages 
            SET is_read = TRUE 
            WHERE user_id = :userId AND sender = 'admin' AND is_read = FALSE
        `, { replacements: { userId: req.userId }, type: QueryTypes.UPDATE });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// USER: Send message to admin
router.post('/', verifyToken, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    
    try {
        await db.sequelize.query(`
            INSERT INTO \`support_messages\` (\`user_id\`, \`sender\`, \`message\`, \`is_read\`, \`created_at\`) 
            VALUES (:userId, 'user', :message, 0, NOW())
        `, { replacements: { userId: req.userId, message }, type: QueryTypes.INSERT });
        
        res.json({ success: true });
    } catch (err) {
        console.error("Chat Error:", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

// ADMIN: Get list of users who have chatted
router.get('/users', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await db.sequelize.query(`
            SELECT u.id, u.name, u.email, 
                   MAX(sm.created_at) as last_activity,
                   SUM(CASE WHEN sm.is_read = FALSE AND sm.sender = 'user' THEN 1 ELSE 0 END) as unread_count
            FROM users u
            JOIN support_messages sm ON u.id = sm.user_id
            GROUP BY u.id, u.name, u.email
            ORDER BY last_activity DESC
        `, { type: QueryTypes.SELECT });
        
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ADMIN: Get chat history for a specific user
router.get('/:userId', verifyToken, isAdmin, async (req, res) => {
    try {
        const result = await db.sequelize.query(`
            SELECT * FROM support_messages 
            WHERE user_id = :userId 
            ORDER BY created_at ASC
        `, { replacements: { userId: req.params.userId }, type: QueryTypes.SELECT });
        
        // Mark as read when admin fetches messages
        await db.sequelize.query(`
            UPDATE support_messages 
            SET is_read = TRUE 
            WHERE user_id = :userId AND sender = 'user' AND is_read = FALSE
        `, { replacements: { userId: req.params.userId }, type: QueryTypes.UPDATE });

        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error" });
    }
});

// ADMIN: Send reply to a user
router.post('/:userId', verifyToken, isAdmin, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });
    
    try {
        await db.sequelize.query(`
            INSERT INTO \`support_messages\` (\`user_id\`, \`sender\`, \`message\`, \`is_read\`, \`created_at\`) 
            VALUES (:userId, 'admin', :message, 0, NOW())
        `, { replacements: { userId: req.params.userId, message }, type: QueryTypes.INSERT });
        
        res.json({ success: true });
    } catch (err) {
        console.error("Admin Chat Error:", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

module.exports = router;
