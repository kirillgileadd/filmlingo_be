'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameColumn('user_words', 'phrase', 'sourceContext');
    await queryInterface.changeColumn('user_words', 'sourceContext', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Контекст или место, откуда добавлено слово',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameColumn('user_words', 'sourceContext', 'phrase');
  },
};
