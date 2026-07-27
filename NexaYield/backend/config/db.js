const sql = require('mssql/msnodesqlv8');
require('dotenv').config();

const config = {
    connectionString: 'Driver={SQL Server Native Client 11.0};Server=localhost;Database=InvestmentPlatform;Trusted_Connection=yes;'
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('✅ Connected to SQL Server (Windows Authentication)');
        return pool;
    })
    .catch(err => {
        console.error('❌ Database Connection Failed!', err);
        
        // Fallback to ODBC Driver 17 if Native Client 11 fails
        console.log('Trying Fallback Driver...');
        const fallbackConfig = {
            connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=InvestmentPlatform;Trusted_Connection=yes;'
        };
        return new sql.ConnectionPool(fallbackConfig).connect()
            .then(p => {
                console.log('✅ Connected to SQL Server (Fallback Driver)');
                return p;
            })
            .catch(e => {
                console.error('❌ Fallback Connection also failed', e);
                process.exit(1);
            });
    });

module.exports = {
    sql, poolPromise
};
