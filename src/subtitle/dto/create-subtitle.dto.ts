import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class CreateSubtitleDto {
  @IsString()
  @IsNotEmpty()
  path: string; // Путь к файлу субтитров

  @IsString()
  @IsNotEmpty()
  language: string; // Язык субтитров

  @IsInt()
  filmId: number; // ID фильма, к которому принадлежат субтитры
}
