import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Subtitle } from 'src/subtitle/subtitle.model';
import { FileService } from '../file/file.service';
import { CreateFilmDto, SubtitleDto } from './dto/create-film.dto';
import { Film } from './films.model';
import { VideoVariant } from './video-variant.model';

@Injectable()
export class FilmService {
  constructor(
    @InjectModel(Film)
    private readonly filmModel: typeof Film,
    @InjectModel(Subtitle)
    private readonly subtitleModel: typeof Subtitle,
    @InjectModel(VideoVariant)
    private readonly videoVariantModel: typeof VideoVariant,
    private readonly fileService: FileService,
  ) {}

  async createFilm(
    createFilmDto: CreateFilmDto,
    videoBuffer: Buffer,
    posterBuffer: Buffer,
    bigPosterBuffer: Buffer,
    titleImageBuffer: Buffer,
    filename: string,
    subtitleFiles: SubtitleDto[],
  ): Promise<Film> {
    const posterPath = await this.fileService.savePoster(
      posterBuffer,
      filename,
      'poster',
    );
    const bigPosterPath = await this.fileService.savePoster(
      bigPosterBuffer,
      filename,
      'bigPoster',
    );
    const titleImagePath = await this.fileService.savePoster(
      titleImageBuffer,
      filename,
      'titleImage',
    );

    // Сохраняем видео и получаем пути к M3U8
    const m3u8Paths = await this.fileService.processAndSaveVideo(
      videoBuffer,
      filename,
    );

    // Создаем запись о фильме в базе данных
    const film = await this.filmModel.create({
      posterPath: posterPath,
      bigPosterPath: bigPosterPath,
      titleImagePath: titleImagePath,
      title: createFilmDto.title,
      description: createFilmDto.description,
      imdb_rating: createFilmDto.imdb_rating,
      kinopoisk_rating: createFilmDto.kinopoisk_rating,
      year: createFilmDto.year,
      category: createFilmDto.category,
    });

    // Сохраняем пути к видео в отдельной таблице
    const videoVariants = m3u8Paths.map((path, index) => ({
      filmId: film.id,
      resolution: ['1080p', '720p', '480p'][index], // Или используйте ваш собственный массив разрешений
      videoPath: path,
    }));

    await this.videoVariantModel.bulkCreate(videoVariants); // Сохраняем все варианты сразу

    // Сохраняем субтитры
    const subtitleRecords = await Promise.all(
      subtitleFiles.map(async (dto) => {
        const subtitlePath = this.fileService.saveSubtitle(
          dto.buffer,
          filename,
        ); // Сохраняем субтитр и получаем путь
        return {
          path: subtitlePath,
          language: dto.lang, // Пример, как определить язык
          filmId: film.id, // Связываем субтитры с фильмом
        };
      }),
    );

    // Создаем записи о субтитрах
    await this.subtitleModel.bulkCreate(subtitleRecords); // Сохраняем все субтитры сразу

    return film;
  }

  async getAllFilms(): Promise<Film[]> {
    return this.filmModel.findAll();
  }

  async getFilmById(id: number): Promise<Film> {
    return this.filmModel.findByPk(id, {
      include: [this.videoVariantModel, this.subtitleModel], // Включаем видео варианты
    });
  }

  async deleteFilm(id: number): Promise<void> {
    const film = await this.getFilmById(id);
    if (film) {
      await film.destroy();
    }
  }
}
