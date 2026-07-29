module.exports = (sequelize, DataTypes) => {
  const ReferralEarning =  "sequelize.define('" +   const ReferralEarning = sequelize.define('REFERRAL_EARNINGS', {.Groups[1].Value.ToLower() + "'" , {
    referrer_id: { type: DataTypes.INTEGER },
    referred_user_id: { type: DataTypes.INTEGER },
    investment_id: { type: DataTypes.INTEGER },
    profit_amount: { type: DataTypes.DECIMAL(18, 2) },
    status: { type: DataTypes.STRING, defaultValue: 'Paid' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
     "tableName: '" +     tableName: 'REFERRAL_EARNINGS'.Groups[1].Value.ToLower() + "'" 
  });

  return ReferralEarning;
};
