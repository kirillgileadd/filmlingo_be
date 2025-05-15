import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  HasMimeType,
  IsFile,
  MaxFileSize,
  MemoryStoredFile,
} from 'nestjs-form-data';
import { ApiProperty } from '@nestjs/swagger';
import { CreateSubtitleDto } from '../../subtitle/dto/create-subtitle.dto';

export class CreateFilmVideosDto {
  @IsNotEmpty()
  @IsFile()
  @HasMimeType(['video/mp4', 'video/webm'])
  @ApiProperty({ type: 'string', format: 'binary', required: false })
  file: MemoryStoredFile;

  @IsString()
  @IsNotEmpty()
  @IsIn(['480p', '720p', '1080p'], {
    message: 'не соответствует 480p, 720p, или 1080p',
  })
  variant: '480p' | '720p' | '1080p';
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

  @ApiProperty({ type: [CreateFilmVideosDto] })
  @IsArray()
  @ValidateNested()
  @Type(() => CreateFilmVideosDto)
  videos: CreateFilmVideosDto[];

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

  @ApiProperty({ type: [CreateSubtitleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSubtitleDto)
  subtitles: CreateSubtitleDto[];
}
