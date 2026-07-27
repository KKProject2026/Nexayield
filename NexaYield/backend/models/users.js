module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('USERS', {
    name: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, unique: true },
    password: { type: DataTypes.STRING },
    referral_code: { type: DataTypes.STRING, unique: true },
    referred_by: { type: DataTypes.INTEGER, allowNull: true },
    wallet_address: { type: DataTypes.STRING },
    status: { type: DataTypes.STRING, defaultValue: 'Active' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
    tableName: 'USERS'
  });

  return User;
};
