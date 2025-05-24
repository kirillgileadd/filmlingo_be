import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePhraseDto {
  @ApiProperty({ description: 'Оригинальная фраза', example: 'hello' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @IsString({ message: 'Должно быть строкой' })
  original!: string;

  @ApiProperty({ description: 'Перевод фразы', example: 'привет' })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @IsString({ message: 'Должно быть строкой' })
  translation!: string;

  @ApiProperty({
    description: 'Тип фразы',
    example: 'idiom',
    enum: ['idiom', 'phrasal_verb'],
  })
  @IsNotEmpty({ message: 'Обязательное поле' })
  @IsString({ message: 'Должно быть строкой' })
  @IsIn(['idiom', 'phrasal_verb'], {
    message: 'Допустимые значения: idiom или phrasal_verb',
  })
  type!: 'idiom' | 'phrasal_verb';

  @ApiProperty({
    description: 'Контекст, из которого добавлена фраза',
    example: 'Hello, how are you?',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  sourceContext?: string;
}
