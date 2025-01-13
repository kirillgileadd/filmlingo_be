import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class AddRoleDto {
  @IsString()
  @IsNotEmpty({ message: 'Значение роли (value) не должно быть пустым.' })
  @ApiProperty({
    description: 'Значение роли, которую необходимо добавить пользователю.',
    example: 'ADMIN',
  })
  readonly value: string;

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
}
