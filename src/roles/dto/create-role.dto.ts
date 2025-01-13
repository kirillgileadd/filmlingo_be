import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsNotEmpty({ message: 'Значение роли не может быть пустым' })
  @IsString({ message: 'Должно быть строкой' })
  @ApiProperty({ description: 'Значение роли', example: 'EXAMPLE' })
  readonly value: string;
  @IsNotEmpty({ message: 'Описание роли не может быть пустым' })
  @IsString({ message: 'Должно быть строкой' })
  @ApiProperty({ description: 'Описание роли', example: 'Описание' })
  readonly description: string;
}
