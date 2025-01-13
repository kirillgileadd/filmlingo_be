import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class TranslateDto {
  @IsString({ message: 'Должно быть строкой' })
  @ApiProperty()
  text: string;

  @IsString()
  @Matches(/^[a-zA-Z]{2}$/, {
    message:
      'targetLang должен быть двухбуквенным кодом языка (например, "en" или "ru").',
  })
  @ApiProperty()
  targetLang: string;
}
