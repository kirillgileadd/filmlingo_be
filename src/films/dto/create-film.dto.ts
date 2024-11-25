import { IsNumber, IsString } from 'class-validator';

export class CreateFilmDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  imdb_rating: number;

  @IsString()
  kinopoisk_rating: number;

  @IsString()
  year: number;

  @IsString()
  category: string;

  subtitles: { lang: string }[];
}

export class SubtitleDto {
  buffer?: Buffer;
  file?: Express.Multer.File[];
  lang: string;
}
