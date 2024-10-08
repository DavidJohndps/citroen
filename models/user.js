'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      // define association here
      User.hasMany(models.Dealer, {
        foreignKey: 'sales',
        as: 'Sales Head',
        type: DataTypes.UUID
      })
      User.hasMany(models.Dealer, {
        foreignKey: 'head',
        as: 'Dealer Head',
        type: DataTypes.UUID
      })
      User.hasMany(models.Dealer, {
        foreignKey: 'service',
        as: 'Service Head',
        type: DataTypes.UUID
      })
    }
  }

  User.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM,
      values: ['0', '1', '2'],
      allowNull: false
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    whatsappLink: {
      type: DataTypes.STRING,
      allowNull: true
    },
    profile_picture: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};