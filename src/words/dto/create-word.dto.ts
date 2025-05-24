import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWordDto {
  @ApiProperty({ description: 'Оригинальное слово', example: 'hello' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @IsString({ message: 'Должно быть строкой' })
  original!: string;

  @ApiProperty({ description: 'Перевод слова', example: 'привет' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @IsString({ message: 'Должно быть строкой' })
  translation!: string;

  @ApiProperty({
    description: 'Контекст, из которого добавлено слово',
    example: 'Hello, how are you?',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  sourceContext?: string;
}
