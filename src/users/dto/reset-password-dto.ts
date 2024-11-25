import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: '123', description: 'Password' })
  readonly password: string;
  @ApiProperty({ example: '12312-312312-3123', description: 'Token' })
  readonly token: string;
}
