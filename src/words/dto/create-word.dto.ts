import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWordDto {
  @ApiProperty({ description: 'Оригинальное слово', example: 'hello' })
  @IsString()
  original!: string;

  @ApiProperty({ description: 'Перевод слова', example: 'привет' })
  @IsString()
  translation!: string;

  @ApiProperty({
    description: 'Фраза, из которой добавлено слово',
    example: 'Hello, how are you?',
    required: false,
  })
  @IsOptional()
  @IsString()
  phrase?: string;
}
