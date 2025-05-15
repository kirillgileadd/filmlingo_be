'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('subtitle_phrases', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      subtitleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'subtitles',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      phraseId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'phrases',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addConstraint('subtitle_phrases', {
      fields: ['subtitleId', 'phraseId'],
      type: 'unique',
      name: 'subtitle_phrase_unique',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('subtitle_phrases');
  },
};
