'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.addColumn('Films', 'titleImagePath', {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn('Films', 'bigPosterPath', {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Films', 'titleImagePath');
    await queryInterface.removeColumn('Films', 'bigPosterPath');
  },
};
