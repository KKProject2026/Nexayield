module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('SETTINGS', {
    company_wallet: { type: DataTypes.STRING }
  }, {
    timestamps: false,
    tableName: 'SETTINGS'
  });

  return Setting;
};
