const { poolPromise, sql } = require('./backend/config/db');

async function run() {
    try {
        const pool = await poolPromise;
        
        console.log("Testing OUTPUT INSERTED.id...");
        const res = await pool.request()
            .input('name', sql.VarChar, 'TestUser')
            .input('email', sql.VarChar, 'test@test.com')
            .query("INSERT INTO users (name, email) OUTPUT INSERTED.id VALUES (@name, @email)");
        
        console.log("Insert result:", res);
        console.log("ID returned:", res.recordset[0].id);

        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}
run();
