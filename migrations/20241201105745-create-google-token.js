'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // await queryInterface.createTable('google-token', {
    //   id: {
    //     type: Sequelize.INTEGER,
    //     allowNull: false,
    //     autoIncrement: true,
    //     primaryKey: true,
    //   },
    //   refreshToken: {
    //     type: Sequelize.STRING(1000),
    //     allowNull: false,
    //   },
    //   accessToken: {
    //     type: Sequelize.STRING(1000),
    //     allowNull: false,
    //   },
    //   expiryDate: {
    //     type: Sequelize.FLOAT,
    //     allowNull: false,
    //   },
    //   createdAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //     defaultValue: Sequelize.NOW,
    //   },
    //   updatedAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //     defaultValue: Sequelize.NOW,
    //   },
    // });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('google-token');
  },
};
