'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const { DataTypes } = Sequelize;

    await queryInterface.addColumn('phrases', 'type', {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'default', // укажи подходящее значение, если поле обязательно
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('phrases', 'type');
  },
};
