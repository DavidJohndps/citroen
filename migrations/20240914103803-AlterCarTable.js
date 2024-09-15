'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('Cars', 'price', {
      type: Sequelize.JSON,
      allowNull: false,
    })
    await queryInterface.addColumn('Cars', 'brochure', {
      type: Sequelize.STRING,
      allowNull: false,
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('Cars', 'price', {
      type: Sequelize.FLOAT,
      allowNull: false,
    })
    await queryInterface.removeColumn('Cars', 'brochure');
  }
};
