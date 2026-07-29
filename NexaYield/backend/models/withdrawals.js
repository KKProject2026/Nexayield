module.exports = (sequelize, DataTypes) => {
  const Withdrawal = sequelize.define('WITHDRAWALS', {
    user_id: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    wallet_address: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
    tableName: 'WITHDRAWALS'
  });

  return Withdrawal;
};
