import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TranslateDto {
  @IsString()
  @ApiProperty()
  text: string;

  @IsString()
  @ApiProperty()
  targetLang: string;
}
