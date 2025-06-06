import { IsNotEmpty, IsString } from 'class-validator';
import { FileSystemStoredFile } from 'nestjs-form-data';

export class CreateSubtitleDto {
  @IsNotEmpty({ message: 'subtitle file is empty' })
  file: FileSystemStoredFile;

  @IsString()
  @IsNotEmpty({ message: 'subtitle language is empty' })
  language: string;
}
