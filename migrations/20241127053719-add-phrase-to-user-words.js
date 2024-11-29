'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.addColumn('user_words', 'phrase', {
    //   type: Sequelize.STRING,
    //   allowNull: true, // или false, если поле обязательно
    // });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_words', 'phrase');
  },
};
