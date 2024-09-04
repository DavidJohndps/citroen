'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class City extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      City.belongsTo(models.Province, {
        foreignKey: 'provinceId'
      })
    }
  }
  City.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    name: DataTypes.STRING,
    provinceId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Province',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'City',
    timestamps: false
  });
  return City;
};