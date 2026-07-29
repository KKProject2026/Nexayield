const db = require('./config/db');
const { QueryTypes } = require('sequelize');

async function test() {
    try {
        const u = await db.USERS.findOne({where: {referral_code: 'NYLGMTMT'}});
        if(!u) return console.log("User not found");
        
        const result = await db.sequelize.query(`
            SELECT u.name, u.email, u.created_at as joined_date,
                IFNULL((SELECT SUM(amount) FROM USER_INVESTMENTS WHERE user_id = u.id AND status = 'Active'), 0) as total_invested,
                IFNULL((SELECT SUM(profit_amount) FROM REFERRAL_EARNINGS WHERE referrer_id = :userId AND referred_user_id = u.id AND status = 'Paid'), 0) as earned_from_user
            FROM USERS u
            WHERE u.referred_by = :userId
            ORDER BY u.created_at DESC
        `, { replacements: { userId: u.id }, type: QueryTypes.SELECT });
        console.log("Success length:", result.length);
        console.log("Success result:", JSON.stringify(result, null, 2));
    } catch(e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}
test();
