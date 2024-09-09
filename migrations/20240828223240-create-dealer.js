'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Dealers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      workingHours: {
        type: Sequelize.JSON,
        allowNull: false
      },
      pic: {
        type: Sequelize.STRING,
        allowNull: false
      },
      head: {
        type: Sequelize.STRING,
        allowNull: false
      },
      address: {
        type: Sequelize.STRING,
        allowNull: false
      },
      mapLink: {
        type: Sequelize.STRING,
        allowNull: false
      },
      longitude: {
        type: Sequelize.STRING,
        allowNull: false
      },
      latitude: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      provinceId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      cityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      img: {
        type: Sequelize.STRING,
        allowNull: true
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Dealers');
  }
};