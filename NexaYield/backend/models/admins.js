module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define('admins', {
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
    tableName: 'admins'
  });

  return Admin;
};
