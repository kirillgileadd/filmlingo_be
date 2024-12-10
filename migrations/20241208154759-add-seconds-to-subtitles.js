'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('subtitles', 'startSeconds', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });

    await queryInterface.addColumn('subtitles', 'endSeconds', {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('subtitles', 'startSeconds');
    await queryInterface.removeColumn('subtitles', 'endSeconds');
  },
};
