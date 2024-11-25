'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.addColumn('Films', 'imdb_rating', {
    //   type: Sequelize.FLOAT,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn('Films', 'kinopoisk_rating', {
    //   type: Sequelize.FLOAT,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn('Films', 'year', {
    //   type: Sequelize.INTEGER,
    //   allowNull: true,
    // });
    // await queryInterface.addColumn('Films', 'category', {
    //   type: Sequelize.STRING,
    //   allowNull: true,
    // });

    // Если у вас есть связь с субтитрами
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Films', 'imdb_rating');
    await queryInterface.removeColumn('Films', 'kinopoisk_rating');
    await queryInterface.removeColumn('Films', 'year');
    await queryInterface.removeColumn('Films', 'category');
  },
};
