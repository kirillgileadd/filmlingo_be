import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  HasMimeType,
  IsFile,
  IsFiles,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';
import { ApiProperty } from '@nestjs/swagger';

export class SubtitleDto {
  @IsString()
  language: string;
}

export class CreateFilmDto {
  @IsString()
  @IsNotEmpty()
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

  @IsFile()
  @MaxFileSize(2000e6) // Максимальный размер файла 10MB (например)
  @HasMimeType(['video/mp4', 'video/webm']) // MIME-типы для видео
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  video?: MemoryStoredFile;

  @IsFile()
  @MaxFileSize(5e6) // Ограничение на размер файла, например 1MB для poster
  @HasMimeType(['image/jpeg', 'image/png']) // MIME-типы для изображений
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  poster?: MemoryStoredFile;

  @IsFile()
  @MaxFileSize(10e6) // Ограничение для больших постеров
  @HasMimeType(['image/jpeg', 'image/png'])
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  big_poster?: MemoryStoredFile;

  @IsFile()
  @MaxFileSize(5e6) // Ограничение для изображения титульного изображения
  @HasMimeType(['image/jpeg', 'image/png'])
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  title_image?: MemoryStoredFile;

  @IsFiles({ each: true })
  // @MaxFileSize(10e6) // Ограничение на размер субтитров (например, 5MB)
  // @HasMimeType(['application/x-subrip', 'text/srt'])
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  subtitlesFiles?: MemoryStoredFile[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubtitleDto)
  subtitles: SubtitleDto[];
}
