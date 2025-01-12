import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgotPassUserDto {
  @ApiProperty({ example: 'mail@mail.ru', description: 'Email' })
  @IsEmail({}, { message: 'Неверный email адрес' })
  readonly email: string;
}
