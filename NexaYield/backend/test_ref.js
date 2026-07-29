const db = require('./config/db');
const { QueryTypes } = require('sequelize');

async function test() {
    try {
        const result = await db.sequelize.query(`
            SELECT u.name, u.email, u.created_at as joined_date,
                IFNULL((SELECT SUM(amount) FROM user_investments WHERE user_id = u.id AND status = 'Active'), 0) as total_invested,
                IFNULL((SELECT SUM(profit_amount) FROM referral_earnings WHERE referrer_id = :userId AND referred_user_id = u.id AND status = 'Paid'), 0) as earned_from_user
            FROM users u
            WHERE u.referred_by = :userId
            ORDER BY u.created_at DESC
        `, { replacements: { userId: 1 }, type: QueryTypes.SELECT });
        console.log("Success:", result);
    } catch(e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}
test();
