module.exports = (sequelize, DataTypes) => {
  const Withdrawal =  "sequelize.define('" +   const Withdrawal = sequelize.define('WITHDRAWALS', {.Groups[1].Value.ToLower() + "'" , {
    user_id: { type: DataTypes.INTEGER },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    wallet_address: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Pending' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
     "tableName: '" +     tableName: 'WITHDRAWALS'.Groups[1].Value.ToLower() + "'" 
  });

  return Withdrawal;
};
