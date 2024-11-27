'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Изменяем длину поля на 1000
    // await queryInterface.changeColumn('token', 'refreshToken', {
    //   type: Sequelize.STRING(1000), // Увеличиваем длину
    //   allowNull: true, // Убедитесь, что настройки соответствуют вашей модели
    // });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('token', 'refreshToken', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });
  },
};
