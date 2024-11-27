'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('words', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      original: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      translation: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    // Создаем таблицу UserWords
    await queryInterface.createTable('user_words', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // Имя таблицы пользователей
          key: 'id',
        },
        onDelete: 'CASCADE', // Удаляем записи UserWords при удалении пользователя
      },
      wordId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'words',
          key: 'id',
        },
        onDelete: 'CASCADE', // Удаляем записи UserWords при удалении слова
      },
      phrase: {
        type: Sequelize.STRING,
        allowNull: true, // Фраза, из которой пользователь добавил слово
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addConstraint('user_words', {
      fields: ['userId', 'wordId'],
      type: 'unique',
      name: 'unique_user_word',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user-words');
    await queryInterface.dropTable('words');
  },
};
