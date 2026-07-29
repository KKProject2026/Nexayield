module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('settings', {
    company_wallet: { type: DataTypes.STRING },
    company_qr: { type: DataTypes.STRING }
  }, {
    timestamps: false,
    tableName: 'settings'
  });

  return Setting;
};
