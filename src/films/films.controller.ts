// controllers/film.controller.ts
import {
  Controller,
  Post,
  Body,
  UploadedFiles,
  UseInterceptors,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { FilmService } from './films.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { Film } from './films.model';

@ApiTags('Films')
@Controller('films')
export class FilmController {
  constructor(private readonly filmService: FilmService) {}

  @Post('create')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'video', maxCount: 1 },
      { name: 'poster', maxCount: 1 },
      { name: 'big_poster', maxCount: 1 },
      { name: 'title_image', maxCount: 1 },
      { name: 'subtitlesFiles', maxCount: 4 },
    ]),
  )
  @ApiOperation({ summary: 'Создать новую запись фильма с видео и постером' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Загрузите видео, постер, субтитры и другие данные фильма',
    required: true,
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Название фильма' },
        description: { type: 'string', description: 'Описание фильма' },
        imdb_rating: { type: 'number', description: 'IMDB рейтинг' },
        kinopoisk_rating: { type: 'number', description: 'Кинопоиск рейтинг' },
        year: { type: 'number', description: 'Год' },
        category: { type: 'string', description: 'Категория' },
        video: {
          type: 'string',
          format: 'binary',
          description: 'Файл видео для фильма',
        },
        poster: {
          type: 'string',
          format: 'binary',
          description: 'Изображение постера для фильма',
        },
        big_poster: {
          type: 'string',
          format: 'binary',
          description: 'Изображение большого постера для фильма',
        },
        title_image: {
          type: 'string',
          format: 'binary',
          description: 'Изображение названия для фильма',
        },
        subtitles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              file: {
                type: 'string',
                format: 'binary',
                description: 'Файл субтитров',
              },
              lang: {
                type: 'string',
                description: 'Язык субтитров (например, en, ru)',
              },
            },
          },
          description: 'Массив субтитров с языковыми метками',
        },
      },
    },
  })
  async createFilm(
    @UploadedFiles()
    files: {
      video?: Express.Multer.File[];
      poster?: Express.Multer.File[];
      big_poster?: Express.Multer.File[];
      title_image?: Express.Multer.File[];
      subtitlesFiles?: Express.Multer.File[];
    },
    @Body() createFilmDto: CreateFilmDto,
  ) {
    const videoBuffer = files.video[0].buffer;
    const posterBuffer = files.poster[0].buffer;
    const bigPosterBuffer = files.big_poster[0].buffer;
    const titleImageBuffer = files.title_image[0].buffer;
    const filename = files.video[0].originalname;

    if (files.subtitlesFiles && createFilmDto.subtitles) {
      // Преобразуем массив файлов в нужный формат
      createFilmDto.subtitles = createFilmDto.subtitles.map(
        (subtitle, index) => ({
          buffer: files.subtitlesFiles[index].buffer,
          lang: subtitle.lang,
        }),
      );
    }

    createFilmDto.kinopoisk_rating = Number(createFilmDto.kinopoisk_rating);
    createFilmDto.imdb_rating = Number(createFilmDto.imdb_rating);
    createFilmDto.year = Number(createFilmDto.year);

    console.log(createFilmDto, 'createFilmDto');

    return this.filmService.createFilm(
      createFilmDto,
      videoBuffer,
      posterBuffer,
      bigPosterBuffer,
      titleImageBuffer,
      filename,
      createFilmDto.subtitles,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Получение списка всех фильмов' })
  @ApiResponse({
    status: 200,
    description: 'Список фильмов успешно получен.',
    type: [Film],
  })
  async getFilms(): Promise<Film[]> {
    return this.filmService.getAllFilms();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получение фильма по ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID фильма' })
  @ApiResponse({
    status: 200,
    description: 'Фильм успешно найден.',
    type: Film,
  })
  @ApiResponse({ status: 404, description: 'Фильм не найден.' })
  async getFilm(@Param('id') id: number): Promise<Film> {
    return this.filmService.getFilmById(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удаление фильма по ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID фильма' })
  @ApiResponse({ status: 204, description: 'Фильм успешно удален.' })
  @ApiResponse({ status: 404, description: 'Фильм не найден.' })
  async deleteFilm(@Param('id') id: number): Promise<void> {
    return this.filmService.deleteFilm(id);
  }
}
