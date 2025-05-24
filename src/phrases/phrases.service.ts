import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Phrase } from './phrase.model';
import { UserPhrases } from './user-phrases.model';
import { User } from 'src/users/users.model';

@Injectable()
export class PhrasesService {
  constructor(
    @InjectModel(Phrase) private readonly phraseModel: typeof Phrase,
    @InjectModel(UserPhrases)
    private readonly userPhraseModel: typeof UserPhrases,
    @InjectModel(User) private readonly userModel: typeof User,
  ) {}

  async findUsersPhrases(
    userId: number,
    page: number,
    pageSize: number,
    order?: string,
    orderValue?: string,
  ) {
    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const basePhrases = await this.userPhraseModel.findAndCountAll({
      where: { userId: userId },
      attributes: ['id', 'createdAt', 'sourceContext'],
      include: [
        {
          model: this.phraseModel,
        },
      ],
      offset,
      limit,
      ...(orderValue && order
        ? { order: [[orderValue, order?.toUpperCase()]] }
        : {}),
    });

    const phrases = basePhrases.rows.map((userPhrase) => ({
      id: userPhrase.id,
      original: userPhrase.phrase.original,
      translation: userPhrase.phrase.translation,
      creationAt: userPhrase.createdAt,
      type: userPhrase.phrase.type,
      sourceContext: userPhrase.sourceContext,
    }));

    return {
      rows: phrases,
      totalCount: basePhrases.count,
      currentPage: page,
      totalPages: Math.ceil(basePhrases.count / pageSize),
    };
  }

  async addPhrase(userId: number, createPhraseDto: CreatePhraseDto) {
    const { original, translation, type, sourceContext } = createPhraseDto;

    let phrase = await this.phraseModel.findOne({
      where: { original, translation, type },
    });

    if (!phrase) {
      phrase = await this.create({ original, translation, type });
    }

    const userPhrase = await this.userPhraseModel.findOne({
      where: { userId, phraseId: phrase.id },
    });

    if (!userPhrase) {
      await this.userPhraseModel.create({
        userId,
        phraseId: phrase.id,
        sourceContext,
      });
    } else if (sourceContext) {
      userPhrase.sourceContext = sourceContext;
      await userPhrase.save();
    }

    return phrase;
  }

  async removePhrase(userId: number, phraseId: number) {
    const userPhrase = await this.userPhraseModel.findOne({
      where: { userId, phraseId },
    });

    if (!userPhrase) {
      throw new NotFoundException('Фраза не найдена for the user');
    }

    await userPhrase.destroy();
    return { message: 'Phrase removed from user dictionary' };
  }

  async findRandomPhrases(userId: number, count: number = 20) {
    const userPhrases = await this.userPhraseModel.findAll({
      where: { userId: userId },
      attributes: ['id', 'sourceContext', 'createdAt'],
      include: [
        {
          model: this.phraseModel,
        },
      ],
    });

    if (!userPhrases || userPhrases.length === 0) {
      throw new NotFoundException('No phrases found for the user');
    }

    const shuffledPhrases = userPhrases.sort(() => 0.5 - Math.random());
    const selectedPhrases = shuffledPhrases.slice(
      0,
      Math.min(count, userPhrases.length),
    );

    const phrases = selectedPhrases.map((userPhrase) => ({
      id: userPhrase.id,
      original: userPhrase.phrase.original,
      translation: userPhrase.phrase.translation,
      creationAt: userPhrase.createdAt,
      type: userPhrase.phrase.type,
      sourceContext: userPhrase.sourceContext,
    }));

    return {
      phrases,
      totalCount: userPhrases.length,
      returnedCount: phrases.length,
    };
  }

  async create(createPhraseDto: CreatePhraseDto) {
    const { original, translation, type } = createPhraseDto;

    return await this.phraseModel.create({ original, translation, type });
  }

  async findAll() {
    return this.phraseModel.findAll({
      attributes: ['id', 'original', 'translation', 'type'],
    });
  }

  async findOne(id: number) {
    if (!id) {
      throw new BadRequestException('Не передан id');
    }

    const phrase = await this.phraseModel.findOne({
      where: { id },
      attributes: ['id', 'original', 'translation'],
    });

    if (!phrase) {
      throw new NotFoundException('Фраза не найдена');
    }

    return phrase;
  }

  async update(id: number, updatePhraseDto: UpdatePhraseDto) {
    const phrase = await this.phraseModel.findOne({ where: { id } });

    if (!phrase) {
      throw new NotFoundException('Фраза не найдена');
    }

    const { original, translation, type } = updatePhraseDto;

    if (original) phrase.original = original;
    if (translation) phrase.translation = translation;
    if (type) phrase.type = type;

    await phrase.save();
    return phrase;
  }

  async remove(id: number) {
    if (!id) {
      throw new BadRequestException('Не передан id');
    }

    const phrase = await this.phraseModel.findOne({
      where: { id },
    });

    if (!phrase) {
      throw new NotFoundException('Слово не найдено');
    }

    await this.userPhraseModel.destroy({
      where: { phraseId: phrase.id },
    });

    await phrase.destroy();

    return { message: 'Слово и связанные с ним ассоциации успешно удалены' };
  }
}
