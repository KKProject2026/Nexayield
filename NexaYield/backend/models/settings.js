module.exports = (sequelize, DataTypes) => {
  const Setting =  "sequelize.define('" +   const Setting = sequelize.define('SETTINGS', {.Groups[1].Value.ToLower() + "'" , {
    company_wallet: { type: DataTypes.STRING },
    company_qr: { type: DataTypes.STRING }
  }, {
    timestamps: false,
     "tableName: '" +     tableName: 'SETTINGS'.Groups[1].Value.ToLower() + "'" 
  });

  return Setting;
};
