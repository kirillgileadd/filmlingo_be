'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('subtitles', 'phrases', {
      type: Sequelize.JSON, // Меняем тип на JSON
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('subtitles', 'phrases', {
      type: Sequelize.ARRAY(Sequelize.STRING), // Возвращаем тип обратно
      allowNull: true,
    });
  },
};
