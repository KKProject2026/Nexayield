module.exports = (sequelize, DataTypes) => {
  const DailyProfit =  "sequelize.define('" +   const DailyProfit = sequelize.define('DAILY_PROFITS', {.Groups[1].Value.ToLower() + "'" , {
    investment_id: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    status: { type: DataTypes.STRING, defaultValue: 'Paid' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
     "tableName: '" +     tableName: 'DAILY_PROFITS'.Groups[1].Value.ToLower() + "'" 
  });

  return DailyProfit;
};
