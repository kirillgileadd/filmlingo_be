import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Subtitle } from './subtitle.model';
import { CreateSubtitleDto } from './dto/create-subtitle.dto';
import { Transaction } from 'sequelize';
import { InjectModel } from '@nestjs/sequelize';
import { SubtitleEntry, SubtitleProcessor } from './subtitle.processor';
import { getSubtitles, getVideoDetails } from 'youtube-caption-extractor';
import { Phrase } from '../phrases/phrase.model';
import fs from 'fs';

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

  alignSubtitles(
    engSubs: SubtitleEntry[],
    rusSubs: SubtitleEntry[],
    threshold = 1000,
  ): SubtitleEntry[] {
    const alignedRus: SubtitleEntry[] = [...rusSubs];

    for (let i = 0; i < engSubs.length; i++) {
      const eng = engSubs[i];
      let closestIdx = -1;
      let minDiff = threshold + 1;

      for (let j = 0; j < rusSubs.length; j++) {
        const rus = rusSubs[j];
        const diff = Math.abs(rus.startSeconds - eng.startSeconds);
        if (diff < threshold && diff < minDiff) {
          closestIdx = j;
          minDiff = diff;
        }
      }

      if (closestIdx !== -1) {
        alignedRus[closestIdx].startSeconds = eng.startSeconds;
        alignedRus[closestIdx].startTime = eng.startTime;
        alignedRus[closestIdx].endTime = eng.endTime;
        alignedRus[closestIdx].endSeconds = eng.endSeconds;
      }
    }

    return alignedRus;
  }

  async deleteSubtitle(subtitleId: number): Promise<void> {
    await this.subtitleModel.destroy({ where: { id: subtitleId } });
  }

  async saveSubtitles(
    enSubtitleFilePath: string,
    ruSubtitleFilePath: string,
    filmId: number,
    transaction?: Transaction,
  ): Promise<void> {
    try {
      const bufferEn = fs.readFileSync(enSubtitleFilePath);
      const bufferRU = fs.readFileSync(ruSubtitleFilePath);
      const enSubtitles = await this.subtitleProcessor.parse(bufferEn);
      const ruSubtitles = await this.subtitleProcessor.parse(bufferRU);

      const alignRuSubtitles = this.alignSubtitles(enSubtitles, ruSubtitles);

      const ruMap = new Map(alignRuSubtitles.map((r) => [r.startTime, r.text]));
      const enMap = new Map(enSubtitles.map((e) => [e.startTime, e.text]));

      const enSubtitleInstances = enSubtitles.map((entry) => ({
        filmId,
        startTime: entry.startTime,
        endTime: entry.endTime,
        language: 'en',
        startSeconds: entry.startSeconds,
        endSeconds: entry.endSeconds,
        text: entry.text,
        translate: ruMap.get(entry.startTime) || null,
      }));

      const ruSubtitleInstances = ruSubtitles.map((entry) => ({
        filmId,
        startTime: entry.startTime,
        endTime: entry.endTime,
        language: 'ru',
        startSeconds: entry.startSeconds,
        endSeconds: entry.endSeconds,
        text: entry.text,
        translate: enMap.get(entry.startTime) || null,
      }));

      const enSubs = await this.subtitleModel.bulkCreate(enSubtitleInstances, {
        transaction,
      });

      await this.subtitleModel.bulkCreate(ruSubtitleInstances, {
        transaction,
      });

      await this.subtitleProcessor.extractPhrasesFromSubtitles(
        enSubs,
        transaction,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        console.error('Error saving subtitles:', error);
        throw error;
      }
      console.error('Error saving subtitles:', error);
      throw new InternalServerErrorException('Failed to save subtitles');
    }
  }
}
