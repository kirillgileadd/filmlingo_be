import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Subtitle } from './subtitle.model'; // Импортируйте модель субтитров
import { CreateSubtitleDto } from './dto/create-subtitle.dto'; // Импортируйте DTO для создания субтитра
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { SubtitleProcessor } from './subtitle.processor';
import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor';

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
    language?: string,
  ): Promise<Subtitle[]> {
    return this.subtitleModel.findAll({ where: { filmId, language } });
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
        phrases: this.subtitleProcessor.extractPhrases(sub.text),
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
   * @param videoId - Идентификатор видео
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
        phrases: sub.phrases,
      }));

      await this.subtitleModel.bulkCreate(subtitleInstances, { transaction });
    } catch (error) {
      console.error('Error saving subtitles:', error);
      throw new InternalServerErrorException('Failed to save subtitles');
    }
  }
}
