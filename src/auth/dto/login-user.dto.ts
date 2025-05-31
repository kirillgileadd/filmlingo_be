import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'mail@mail.ru', description: 'Email' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Неверный email' })
  readonly email: string;
  @ApiProperty({ example: '123546', description: 'Пароль' })
  @IsString({ message: 'Должно быть строкой' })
  readonly password: string;
}
