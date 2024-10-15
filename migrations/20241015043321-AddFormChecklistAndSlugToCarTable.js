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
    await queryInterface.addColumn('Cars', 'slug', {
      type: Sequelize.STRING,
      allowNull: true,
    })
    await queryInterface.addColumn('Cars', 'loanForm', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: true,
    })
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.removeColumn('Cars', 'slug');
    await queryInterface.removeColumn('Cars', 'loanForm');
  }
};
