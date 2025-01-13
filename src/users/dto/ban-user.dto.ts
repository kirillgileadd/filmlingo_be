import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class BanUserDto {
  @IsNumber(
    {},
    { message: 'Идентификатор пользователя (userId) должен быть числом.' },
  )
  @IsNotEmpty({ message: 'Идентификатор пользователя (userId) обязателен.' })
  @ApiProperty({
    description: 'Идентификатор пользователя, которому назначается роль.',
    example: 42,
  })
  readonly userId: number;
  @IsOptional()
  @IsString({ message: 'Причина должна быть строкой' })
  @ApiProperty({ description: 'Причина бана юзера', example: 'Нарушитель' })
  readonly banReason: string;
}
