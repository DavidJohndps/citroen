'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CarGalleries', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      carId: {
        type: Sequelize.UUID,
        allowNull: null
      },
      galleryId: {
        type: Sequelize.UUID,
        allowNull: null
      },
      type: {
        type: Sequelize.ENUM,
        values: ['One-Tone', 'Two-Tone'],
        allowNull: false,
        defaultValue: ['One-Tone']
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('CarGalleries');
  }
};