'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.renameTable('VideoVariants', 'video_variants');
    await queryInterface.renameTable('Films', 'films');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.renameTable('video_variants', 'VideoVariants');
    await queryInterface.renameTable('films', 'Films');
  },
};
