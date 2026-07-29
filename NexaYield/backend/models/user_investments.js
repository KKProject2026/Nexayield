module.exports = (sequelize, DataTypes) => {
  const UserInvestment =  "sequelize.define('" +   const UserInvestment = sequelize.define('USER_INVESTMENTS', {.Groups[1].Value.ToLower() + "'" , {
    user_id: { type: DataTypes.INTEGER },
    plan_id: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    daily_profit: { type: DataTypes.DECIMAL(18, 2) },
    total_days: { type: DataTypes.INTEGER },
    days_passed: { type: DataTypes.INTEGER, defaultValue: 0 },
    start_date: { type: DataTypes.DATE },
    end_date: { type: DataTypes.DATE },
    next_profit_time: { type: DataTypes.DATE },
    status: { type: DataTypes.STRING, defaultValue: 'Active' }
  }, {
    timestamps: false,
     "tableName: '" +     tableName: 'USER_INVESTMENTS'.Groups[1].Value.ToLower() + "'" 
  });

  return UserInvestment;
};
