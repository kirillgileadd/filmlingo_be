import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSubtitleDto {
  @IsNotEmpty()
  buffer: Buffer; // Путь к файлу субтитров

  @IsString()
  @IsNotEmpty()
  language: string; // Язык субтитров
}
