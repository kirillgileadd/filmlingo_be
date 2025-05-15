import { IsNotEmpty, IsString } from 'class-validator';
import { MemoryStoredFile } from 'nestjs-form-data';

export class CreateSubtitleDto {
  @IsNotEmpty()
  file: MemoryStoredFile;

  @IsString()
  @IsNotEmpty()
  language: string;
}
