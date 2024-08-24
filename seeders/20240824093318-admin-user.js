'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Users', [
      {
        id: '95b725be-5011-4e9d-917b-393450db0b47',
        username: 'admin',
        name: 'Admin',
        role: '0',
        phone_number: '081200001111',
        password: '$2a$10$HqyUpoj9RiKl9ZBGMtOobuK.xrqJ.exkL/KHLdLPXCuk/pg24IIDS',
        email: 'admin@citroen.co.id'
      }
    ], {});
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
