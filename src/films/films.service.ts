import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subtitle } from 'src/subtitle/subtitle.model';
import { FileService } from '../file/file.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { Film } from './films.model';
import { VideoVariant } from './video-variant.model';
import { SubtitleService } from 'src/subtitle/subtitle.service';
import { Sequelize } from 'sequelize';

@Injectable()
export class FilmService {
  constructor(
    @InjectModel(Film)
    private readonly filmModel: typeof Film,
    @InjectModel(Subtitle)
    private readonly subtitleModel: typeof Subtitle,
    @InjectModel(VideoVariant)
    private readonly videoVariantModel: typeof VideoVariant,
    private readonly subtitleService: SubtitleService,
    private readonly fileService: FileService,
    @Inject('Sequelize') private readonly sequelize: Sequelize,
  ) {}

  async createFilm(createFilmDto: CreateFilmDto): Promise<Film> {
    const transaction = await this.sequelize.transaction();

    try {
      const posterPath = await this.fileService.savePoster(
        createFilmDto.poster,
      );
      const bigPosterPath = await this.fileService.savePoster(
        createFilmDto.big_poster,
      );
      const titleImagePath = await this.fileService.savePoster(
        createFilmDto.title_image,
      );

      // Сохраняем видео и получаем пути к M3U8
      const m3u8Paths = await this.fileService.processAndSegmentVideos(
        createFilmDto.videos,
      );

      // Создаем запись о фильме в базе данных
      const film = await this.filmModel.create(
        {
          posterPath: posterPath,
          bigPosterPath: bigPosterPath,
          titleImagePath: titleImagePath,
          title: createFilmDto.title,
          description: createFilmDto.description,
          imdb_rating: createFilmDto.imdb_rating,
          kinopoisk_rating: createFilmDto.kinopoisk_rating,
          year: createFilmDto.year,
          category: createFilmDto.category,
        },
        { transaction },
      );

      // Сохраняем пути к видео в отдельной таблице
      const videoVariants = m3u8Paths.map((variant) => ({
        filmId: film.id,
        resolution: variant.variant,
        videoPath: variant.path,
      }));

      await this.videoVariantModel.bulkCreate(videoVariants, { transaction }); // Сохраняем все варианты сразу

      try {
        await this.subtitleService.saveSubtitles(
          createFilmDto.subtitles_en.file.path,
          createFilmDto.subtitles_ru.file.path,
          film.id,
          transaction,
        );
      } catch (error) {
        console.error('Error in createFilm:', error);
        throw new InternalServerErrorException('Failed to create film no subs');
      }

      await transaction.commit();

      return film;
    } catch (error) {
      await transaction.rollback();
      console.error('Error in createFilm:', error);
      throw new InternalServerErrorException('Failed to create film');
    }
  }

  async getAllFilms(): Promise<Film[]> {
    return this.filmModel.findAll({
      order: [['createdAt', 'DESC']],
    });
  }

  async getFilmById(id: number): Promise<Film> {
    const film = await this.filmModel.findByPk(id, {
      include: [
        this.videoVariantModel,
        {
          model: this.subtitleModel,
          required: false,
          attributes: ['language', 'filmId'],
        },
      ],
    });

    if (!film) return null;

    const uniqueLanguageSubtitles: Subtitle[] = [];

    const seenLanguages = new Set<string>();

    for (const subtitle of film.subtitles) {
      if (!seenLanguages.has(subtitle.language)) {
        uniqueLanguageSubtitles.push(subtitle);
        seenLanguages.add(subtitle.language);
      }
    }

    const filmPlain = film.get({ plain: true });
    filmPlain.subtitles = uniqueLanguageSubtitles;

    return filmPlain;
  }

  async getFilmModeById(id: number): Promise<Film> {
    const film = await this.filmModel.findByPk(id, {
      include: [
        this.videoVariantModel,
        {
          model: this.subtitleModel,
          required: false,
          attributes: ['language', 'filmId'],
        },
      ],
    });

    if (!film) return null;

    return film;
  }

  async deleteFilm(id: number): Promise<{ message: string }> {
    if (!id || !Number.isInteger(id)) {
      throw new BadRequestException('Неверный id фильма');
    }

    const film = await this.getFilmModeById(id);

    if (!film) {
      throw new NotFoundException('Фильм не найден');
    }

    await Promise.all([
      film.posterPath
        ? this.fileService.deleteFileFromS3(film.posterPath)
        : null,
      film.bigPosterPath
        ? this.fileService.deleteFileFromS3(film.bigPosterPath)
        : null,
      film.titleImagePath
        ? this.fileService.deleteFileFromS3(film.titleImagePath)
        : null,
    ]);

    await Promise.all(
      film.videoVariants.map(async (videoVariant) => {
        const m3u8Url = `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}${videoVariant.videoPath}`;

        const segmentKeys = await this.fileService.getS3KeysFromM3U8(m3u8Url);
        await Promise.all([
          ...segmentKeys.map((key) => this.fileService.deleteFileFromS3(key)),
          this.fileService.deleteFileFromS3(videoVariant.videoPath),
        ]);
      }),
    );

    await film.destroy();

    return { message: `Фильм ${id} успешно удален` };
  }
}
