'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('user_phrases', 'sourceContext', {
      type: Sequelize.STRING,
      allowNull: true,
      comment: 'Контекст или место, откуда добавлена фраза',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('user_phrases', 'sourceContext');
  },
};
