import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: '123', description: 'Password' })
  @IsNotEmpty({ message: 'Новый пароль обязателен' })
  readonly password: string;
  @ApiProperty({ example: '12312-312312-3123', description: 'Token' })
  @IsNotEmpty({ message: 'Ошибка в токене' })
  readonly token: string;
}
