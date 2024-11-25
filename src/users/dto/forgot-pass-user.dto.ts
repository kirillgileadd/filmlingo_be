import { ApiProperty } from '@nestjs/swagger';

export class ForgotPassUserDto {
  @ApiProperty({ example: 'mail@mail.ru', description: 'Email' })
  readonly email: string;
}
