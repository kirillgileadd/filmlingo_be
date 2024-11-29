import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Word } from './word.model';
import { UserWords } from './user-words.model';
import { User } from 'src/users/users.model';

@Injectable()
export class WordsService {
  constructor(
    @InjectModel(Word) private readonly wordModel: typeof Word,
    @InjectModel(UserWords) private readonly userWordModel: typeof UserWords,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async findUsersWords(userId: number, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const baseWords = await this.userWordModel.findAndCountAll({
      where: { userId: userId },
      attributes: ['id', 'phrase', 'createdAt'],
      include: [
        {
          model: this.wordModel,
        },
      ],
      offset,
      limit,
    });

    const words = baseWords.rows.map((userWord) => ({
      id: userWord.id,
      original: userWord.word.original,
      translation: userWord.word.translation,
      creationAt: userWord.createdAt,
      phrase: userWord.phrase,
    }));

    return {
      rows: words,
      totalCount: baseWords.count,
      currentPage: page,
      totalPages: Math.ceil(baseWords.count / pageSize),
    };
  }

  async addWord(userId: number, createWordDto: CreateWordDto) {
    const { original, translation, phrase } = createWordDto;

    // Проверяем, есть ли слово в базе
    let word = await this.wordModel.findOne({
      where: { original, translation },
    });

    if (!word) {
      // Если слово отсутствует, создаем новое
      word = await this.create({ original, translation });
    }

    // Проверяем, связано ли это слово с текущим пользователем
    const userWord = await this.userWordModel.findOne({
      where: { userId, wordId: word.id },
    });

    if (!userWord) {
      // Связываем слово с пользователем, добавляя фразу
      await this.userWordModel.create({ userId, wordId: word.id, phrase });
    } else if (phrase) {
      // Обновляем фразу, если она передана
      userWord.phrase = phrase;
      await userWord.save();
    }

    return word;
  }

  async removeWord(userId: number, wordId: number) {
    const userWord = await this.userWordModel.findOne({
      where: { userId, wordId },
    });

    if (!userWord) {
      throw new NotFoundException('Word not found for the user');
    }

    await userWord.destroy();
    return { message: 'Word removed from user dictionary' };
  }

  async create(createWordDto: CreateWordDto) {
    const { original, translation } = createWordDto;

    return await this.wordModel.create({ original, translation });
  }

  async findAll() {
    return this.wordModel.findAll({
      attributes: ['id', 'original', 'translation'],
    });
  }

  // Получить одно слово по id
  async findOne(id: number) {
    const word = await this.wordModel.findOne({
      where: { id },
      attributes: ['id', 'original', 'translation'],
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word;
  }

  // Обновить слово
  async update(id: number, updateWordDto: UpdateWordDto) {
    const word = await this.wordModel.findOne({ where: { id } });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    const { original, translation } = updateWordDto;

    // Обновляем только те поля, которые переданы
    if (original) word.original = original;
    if (translation) word.translation = translation;

    await word.save();
    return word;
  }

  async remove(id: number) {
    const word = await this.wordModel.findOne({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    // Удаляем все связи с пользователями, где это слово связано
    await this.userWordModel.destroy({
      where: { wordId: word.id },
    });

    // Удаляем само слово
    await word.destroy();

    return { message: 'Word and its associations removed successfully' };
  }
}
