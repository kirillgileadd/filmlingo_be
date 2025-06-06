import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilmService } from './films.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { Film } from './films.model';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/role.guard';
import { FileSystemStoredFile, FormDataRequest } from 'nestjs-form-data';

@ApiTags('Films')
@Controller('films')
export class FilmController {
  constructor(private readonly filmService: FilmService) {}

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('create')
  @FormDataRequest({ storage: FileSystemStoredFile })
  @ApiOperation({ summary: 'Создать новую запись фильма с видео и постером' })
  @ApiConsumes('multipart/form-data')
  async createFilm(@Body() createFilmDto: CreateFilmDto) {
    console.log(createFilmDto, 'createFilmDto');
    createFilmDto.kinopoisk_rating = Number(createFilmDto.kinopoisk_rating);
    createFilmDto.imdb_rating = Number(createFilmDto.imdb_rating);
    createFilmDto.year = Number(createFilmDto.year);

    return this.filmService.createFilm(createFilmDto);
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

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Удаление фильма по ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID фильма' })
  @ApiResponse({ status: 204, description: 'Фильм успешно удален.' })
  @ApiResponse({ status: 404, description: 'Фильм не найден.' })
  async deleteFilm(@Param('id') id: string): Promise<void> {
    const _id = parseInt(id, 10);

    return this.filmService.deleteFilm(_id);
  }
}
