'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'photo', {
      type: Sequelize.STRING,
      allowNull: true, // Поле может быть пустым
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'photo');
  },
};
