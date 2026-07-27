const db = require('../models');

// We sync the models with the database. In production you might want to use migrations instead.
db.sequelize.sync().then(() => {
    console.log('✅ Connected to MySQL Server with Sequelize ORM (Database: earnkk)');
}).catch(err => {
    console.error('❌ Database Connection Failed!', err);
});

module.exports = db;
