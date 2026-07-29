module.exports = (sequelize, DataTypes) => {
  const DailyProfit = sequelize.define('DAILY_PROFITS', {
    investment_id: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    status: { type: DataTypes.STRING, defaultValue: 'Paid' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
    tableName: 'DAILY_PROFITS'
  });

  return DailyProfit;
};
