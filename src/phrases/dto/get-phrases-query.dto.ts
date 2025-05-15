import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetUserPhrasesQueryDto {
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
