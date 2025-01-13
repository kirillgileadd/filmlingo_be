import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { User } from './users/users.model';
import { RolesModule } from './roles/roles.module';
import { Role } from './roles/roles.model';
import { UserRoles } from './roles/user-roles.model';
import { AuthModule } from './auth/auth.module';
import { TokenModule } from './token/token.module';
import { Token } from './token/token.model';
import { MailModule } from './mail/mail.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { FileModule } from './file/file.module';
import { FilmsModule } from './films/films.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SubtitleModule } from './subtitle/subtitle.module';
import { TranslateModule } from './translate/translate.module';
import { YandexIamTokenModule } from './yandex-iam-token/yandex-iam-token.module';
import { WordsModule } from './words/words.module';
import { Word } from './words/word.model';
import { UserWords } from './words/user-words.model';
import { NestjsFormDataModule } from 'nestjs-form-data';

@Module({
  controllers: [],
  providers: [],
  imports: [
    NestjsFormDataModule,
    ConfigModule.forRoot({
      envFilePath: `.${process.env.NODE_ENV}.env`,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    SequelizeModule.forRoot({
      models: [Role, UserRoles, Token, User, Word, UserWords],
      dialect: 'postgres',
      autoLoadModels: true,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      port: Number(process.env.POSTGRES_PORT),
      password: process.env.POSTGRES_PASSWORD,
    }),
    WordsModule,
    YandexIamTokenModule,
    TranslateModule,
    AuthModule,
    TokenModule,
    UsersModule,
    RolesModule,
    MailModule,
    MailerModule,
    FileModule,
    FilmsModule,
    SubtitleModule,
    WordsModule,
  ],
})
export class AppModule {
  constructor() {
    console.log(process.env.POSTGRES_PASSWORD);
  }
}
