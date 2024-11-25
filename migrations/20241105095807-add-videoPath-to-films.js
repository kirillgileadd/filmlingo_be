'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Удаляем поле videoPath из таблицы Films
    await queryInterface.removeColumn('Films', 'videoPath');
  },

  down: async (queryInterface, Sequelize) => {
    // Восстанавливаем поле videoPath в случае отката миграции
    await queryInterface.addColumn('Films', 'videoPath', {
      type: Sequelize.JSONB, // Убедитесь, что тип данных соответствует вашим требованиям
      allowNull: false, // Убедитесь, что это соответствует вашим предыдущим требованиям
    });
  },
};
