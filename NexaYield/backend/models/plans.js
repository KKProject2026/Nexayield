module.exports = (sequelize, DataTypes) => {
  const Plan =  "sequelize.define('" +   const Plan = sequelize.define('PLANS', {.Groups[1].Value.ToLower() + "'" , {
    name: { type: DataTypes.STRING },
    amount: { type: DataTypes.DECIMAL(18, 2) },
    daily_percent: { type: DataTypes.DECIMAL(5, 2) },
    duration_days: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING, defaultValue: 'Active' },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    timestamps: false,
     "tableName: '" +     tableName: 'PLANS'.Groups[1].Value.ToLower() + "'" 
  });

  return Plan;
};
