import { IsNotEmpty, IsString } from 'class-validator';
import { FileSystemStoredFile } from 'nestjs-form-data';

export class CreateSubtitleDto {
  @IsNotEmpty()
  file: FileSystemStoredFile;

  @IsString()
  @IsNotEmpty()
  language: string;
}
