import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class RegistrationUserDto {
  @ApiProperty({ example: 'mail@mail.ru', description: 'Email' })
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Неверный email' })
  readonly email: string;
  @ApiProperty({ example: '123546', description: 'Пароль' })
  @IsString({ message: 'Должно быть строкой' })
  @Length(4, 16, { message: 'Не меньше 4 и не больше 16' })
  readonly password: string;
}
