import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { TokenModule } from '../token/token.module';
import { MailModule } from '../mail/mail.module';
import { GitHubStrategy } from './github.strategy';
import { YandexStrategy } from './yandex.strategy';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, GitHubStrategy, YandexStrategy, GoogleStrategy],
  imports: [
    forwardRef(() => UsersModule),
    TokenModule,
    MailModule,
    PassportModule,
  ],
  exports: [AuthService],
})
export class AuthModule {}
