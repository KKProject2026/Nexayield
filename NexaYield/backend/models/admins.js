module.exports = (sequelize, DataTypes) => {
  const Admin =  "sequelize.define('" +   const Admin = sequelize.define('ADMINS', {.Groups[1].Value.ToLower() + "'" , {
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: 'admin'
    }
  }, {
    timestamps: false,
     "tableName: '" +     tableName: 'ADMINS'.Groups[1].Value.ToLower() + "'" 
  });

  return Admin;
};
