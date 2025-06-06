import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Expose, Type } from 'class-transformer';

class PhraseTranslate {
  @Expose()
  @IsString()
  phrase: string;

  @Expose()
  @IsString()
  translate: string;
}

export class SubtitleChunkDto {
  @Expose()
  @IsString()
  text: string;

  @Expose()
  @IsOptional()
  @IsString()
  translate: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  ai_translate_comment: string | null;

  @Expose()
  @IsOptional()
  @IsString()
  ai_translate: string | null;

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhraseTranslate)
  phrasal_verbs: PhraseTranslate[];

  @Expose()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhraseTranslate)
  idioms: PhraseTranslate[];
}
