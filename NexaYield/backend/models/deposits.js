module.exports = (sequelize, DataTypes) => {
  const Deposit = sequelize.define('DEPOSITS', {
    user_id: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    tx_hash: { type: DataTypes.STRING },
    screenshot: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    investment_id: { type: DataTypes.INTEGER, allowNull: true },
    approved_by: { type: DataTypes.INTEGER, allowNull: true },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
    tableName: 'DEPOSITS'
  });

  return Deposit;
};
