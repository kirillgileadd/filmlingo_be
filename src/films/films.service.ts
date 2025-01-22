import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subtitle } from 'src/subtitle/subtitle.model';
import { FileService } from '../file/file.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { Film } from './films.model';
import { VideoVariant } from './video-variant.model';
import { SubtitleService } from 'src/subtitle/subtitle.service';
import { Sequelize } from 'sequelize';
import { CreateSubtitleDto } from '../subtitle/dto/create-subtitle.dto';

@Injectable()
export class FilmService {
  constructor(
    @InjectModel(Film)
    private readonly filmModel: typeof Film,
    @InjectModel(Subtitle)
    private readonly subtitleModel: typeof Subtitle,
    @InjectModel(VideoVariant)
    private readonly videoVariantModel: typeof VideoVariant,
    private readonly subtitleServie: SubtitleService,
    private readonly fileService: FileService,
    @Inject('Sequelize') private readonly sequelize: Sequelize,
  ) {}

  async createFilm(
    createFilmDto: CreateFilmDto,
    videoBuffer: Buffer,
    posterBuffer: Buffer,
    bigPosterBuffer: Buffer,
    titleImageBuffer: Buffer,
    filename: string,
    posterExtension: string,
    bigPosterExtension: string,
    titleImageExtension: string,
    subtitleFiles: CreateSubtitleDto[],
  ): Promise<Film> {
    const transaction = await this.sequelize.transaction();

    try {
      const posterPath = await this.fileService.savePoster(
        posterBuffer,
        filename,
        posterExtension,
        'poster',
      );
      const bigPosterPath = await this.fileService.savePoster(
        bigPosterBuffer,
        filename,
        bigPosterExtension,
        'bigPoster',
      );
      const titleImagePath = await this.fileService.savePoster(
        titleImageBuffer,
        filename,
        titleImageExtension,
        'titleImage',
      );

      // Сохраняем видео и получаем пути к M3U8
      const m3u8Paths = await this.fileService.processAndSaveVideo(
        videoBuffer,
        filename,
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
      const videoVariants = m3u8Paths.map((path, index) => ({
        filmId: film.id,
        resolution: ['1080p', '720p', '480p'][index], // Или используйте ваш собственный массив разрешений
        videoPath: path,
      }));

      await this.videoVariantModel.bulkCreate(videoVariants, { transaction }); // Сохраняем все варианты сразу

      try {
        await Promise.all(
          subtitleFiles.map(async (dto) => {
            await this.subtitleServie.saveSubtitles(
              dto.buffer,
              dto.language,
              film.id,
              transaction,
            );
          }),
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
    return this.filmModel.findAll();
  }

  async getFilmById(id: number): Promise<Film> {
    return this.filmModel.findByPk(id, {
      include: [
        this.videoVariantModel,
        {
          model: this.subtitleModel,
          required: false,
          attributes: [
            'id',
            'language',
            'startTime',
            'endTime',
            [
              Sequelize.literal(`
              (SELECT DISTINCT ON (sub.language) sub.id
               FROM subtitles AS sub
               WHERE sub."filmId" = ${id}
               AND sub.language = subtitles.language
               ORDER BY sub.language, sub.id ASC
              )
            `),
              'id',
            ],
          ],
        },
      ],
    });
  }

  async deleteFilm(id: number): Promise<void> {
    if (!id || !Number.isInteger(id)) {
      throw new BadRequestException('Not Found');
    }

    const film = await this.getFilmById(id);
    if (film) {
      //TODO - del all s3 files
      // await this.fileService.deleteFileFromS3(film.bigPosterPath);
      // await this.fileService.deleteFileFromS3(film.posterPath);
      // await this.fileService.deleteFileFromS3(film.titleImagePath);
      film.videoVariants.map(async (videoVariant) => {
        const indexPaths = await this.fileService.getS3KeysFromM3U8(
          process.env.S3_PUBLIC_URL + videoVariant.videoPath,
        );
        console.log(indexPaths);
        // indexPaths.map(
        //   async (path) => await this.fileService.deleteFileFromS3(path),
        // );
        // await this.fileService.deleteFileFromS3(videoVariant.videoPath);
        // await film.destroy();
      });
    }
  }
}
