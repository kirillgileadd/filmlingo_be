'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn('user_words', 'createdAt', {
    //   type: Sequelize.DATE,
    //   allowNull: false,
    //   defaultValue: Sequelize.fn('now'),
    // });
    // await queryInterface.addColumn('user_words', 'updatedAt', {
    //   type: Sequelize.DATE,
    //   allowNull: false,
    //   defaultValue: Sequelize.fn('now'),
    // });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_words', 'createdAt');
    await queryInterface.removeColumn('user_words', 'updatedAt');
  },
};
