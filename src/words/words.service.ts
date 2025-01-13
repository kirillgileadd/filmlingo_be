import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  async findUsersWords(
    userId: number,
    page: number,
    pageSize: number,
    order?: string,
    orderValue?: string,
  ) {
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
      ...(orderValue && order
        ? { order: [[orderValue, order?.toUpperCase()]] }
        : {}),
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

    let word = await this.wordModel.findOne({
      where: { original, translation },
    });

    if (!word) {
      word = await this.create({ original, translation });
    }

    const userWord = await this.userWordModel.findOne({
      where: { userId, wordId: word.id },
    });

    if (!userWord) {
      await this.userWordModel.create({ userId, wordId: word.id, phrase });
    } else if (phrase) {
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

  async findRandomWords(userId: number, count: number = 20) {
    console.log(userId, 'userIdasdad');
    const userWords = await this.userWordModel.findAll({
      where: { userId: userId },
      attributes: ['id', 'phrase', 'createdAt'],
      include: [
        {
          model: this.wordModel,
        },
      ],
    });

    if (!userWords || userWords.length === 0) {
      throw new NotFoundException('No words found for the user');
    }

    const shuffledWords = userWords.sort(() => 0.5 - Math.random());
    const selectedWords = shuffledWords.slice(
      0,
      Math.min(count, userWords.length),
    );

    const words = selectedWords.map((userWord) => ({
      id: userWord.id,
      original: userWord.word.original,
      translation: userWord.word.translation,
      creationAt: userWord.createdAt,
      phrase: userWord.phrase,
    }));

    return {
      words,
      totalCount: userWords.length,
      returnedCount: words.length,
    };
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

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('Не передан id');
    }

    const word = await this.wordModel.findOne({
      where: { id },
      attributes: ['id', 'original', 'translation'],
    });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    return word;
  }

  async update(id: number, updateWordDto: UpdateWordDto) {
    const word = await this.wordModel.findOne({ where: { id } });

    if (!word) {
      throw new NotFoundException('Word not found');
    }

    const { original, translation } = updateWordDto;

    if (original) word.original = original;
    if (translation) word.translation = translation;

    await word.save();
    return word;
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('Не передан id');
    }

    const word = await this.wordModel.findOne({
      where: { id },
    });

    if (!word) {
      throw new NotFoundException('Слово не найдено');
    }

    await this.userWordModel.destroy({
      where: { wordId: word.id },
    });

    await word.destroy();

    return { message: 'Слово и связанные с ним ассоциации успешно удалены' };
  }
}
