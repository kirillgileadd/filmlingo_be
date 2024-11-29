'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.changeColumn('token', 'refreshToken', {
    //   type: Sequelize.STRING(1000),
    //   allowNull: false, // если столбец не может быть null, можно оставить
    // });
  },

  async down(queryInterface, Sequelize) {
    // await queryInterface.changeColumn('token', 'refreshToken', {
    //   type: Sequelize.STRING(500), // Возвращаем к первоначальному размеру, если нужно
    //   allowNull: false, // если столбец не может быть null, можно оставить
    // });
  },
};
