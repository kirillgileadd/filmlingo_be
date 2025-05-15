import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Subtitle } from './subtitle.model';
import { CreateSubtitleDto } from './dto/create-subtitle.dto';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { SubtitleProcessor } from './subtitle.processor';
import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor';
import { Phrase } from '../phrases/phrase.model';

@Injectable()
export class SubtitleService {
  constructor(
    private readonly subtitleProcessor: SubtitleProcessor,
    @InjectModel(Subtitle)
    private readonly subtitleModel: typeof Subtitle,
  ) {}

  async addSubtitle(createSubtitleDto: CreateSubtitleDto): Promise<Subtitle> {
    const subtitle = await this.subtitleModel.create(createSubtitleDto);
    return subtitle;
  }

  async getSubtitlesByFilmId(
    filmId: number,
    language: string,
  ): Promise<Subtitle[]> {
    const subtitles = await this.subtitleModel.findAll({
      where: { filmId, ...(language ? { language } : {}) },
      include: [
        {
          model: Phrase,
          through: { attributes: [] },
        },
      ],
    });

    return subtitles.map((subtitle) => {
      const plain = subtitle.get({ plain: true }) as Subtitle & {
        phrases: Phrase[] | null;
      };
      if (!plain.phrases || plain.phrases.length === 0) {
        plain.phrases = null;
      }
      return plain;
    });
  }

  async getYoutubeSubtitles(videoId: string, language: string) {
    const subtitles = await getSubtitles({ videoID: videoId, lang: language });
    const details = await getVideoDetails({ videoID: videoId, lang: language });

    return {
      subtitles: subtitles.map((sub) => ({
        filmId: 0,
        language: language,
        startSeconds: sub.start,
        text: sub.text,
        phrases: null,
        startTime: 0,
        endTime: 0,
        endSeconds: sub.start + sub.dur,
        id: Math.random(),
      })),
      details: details,
    };
  }

  async deleteSubtitle(subtitleId: number): Promise<void> {
    await this.subtitleModel.destroy({ where: { id: subtitleId } });
  }

  /**
   * Сохраняет субтитры в базу данных.
   * @param buffer - Буфер файла субтитров
   * @param language - Буфер файла субтитров
   * @param filmId - Идентификатор видео
   * @param transaction - (Необязательно) Транзакция Sequelize
   */
  async saveSubtitles(
    buffer: Buffer,
    language: string,
    filmId: number,
    transaction?: Transaction,
  ): Promise<void> {
    try {
      const subtitles = await this.subtitleProcessor.parse(buffer);

      const subtitleInstances = subtitles.map((sub) => ({
        filmId,
        startTime: sub.startTime,
        endTime: sub.endTime,
        language: language,
        startSeconds: sub.startSeconds,
        endSeconds: sub.endSeconds,
        text: sub.text,
      }));

      const _subtitles = await this.subtitleModel.bulkCreate(
        subtitleInstances,
        {
          transaction,
        },
      );

      //TODO
      if (language === 'en') {
        await this.subtitleProcessor.extractPhrasesFromSubtitles(
          _subtitles,
          transaction,
        );
      }
    } catch (error) {
      console.error('Error saving subtitles:', error);
      throw new InternalServerErrorException('Failed to save subtitles');
    }
  }
}
