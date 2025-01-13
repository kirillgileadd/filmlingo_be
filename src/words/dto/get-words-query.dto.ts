import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetUserWordsQueryDto {
  @IsOptional()
  @IsString()
  page: string;

  @IsOptional()
  @IsString()
  pageSize: string;

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: string;

  @IsOptional()
  @IsString()
  orderValue?: string;
}
