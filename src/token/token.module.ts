import { Module } from '@nestjs/common';
import { TokenService } from './token.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/users.model';
import { Token } from './token.model';
import { JwtModule } from '@nestjs/jwt';

@Module({
  providers: [TokenService],
  imports: [
    SequelizeModule.forFeature([User, Token]),
    JwtModule.registerAsync({
      useFactory: async () => ({
        secret: process.env.TOKEN_SECRET_KEY,
        signOptions: {
          expiresIn: '1h',
        },
      }),
    }),
  ],
  exports: [TokenService],
})
export class TokenModule {}
