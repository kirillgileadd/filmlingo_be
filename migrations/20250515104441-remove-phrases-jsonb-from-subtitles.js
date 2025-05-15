'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('subtitles', 'phrases');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('subtitles', 'phrases', {
      type: 'JSONB',
      allowNull: true,
    });
  },
};
