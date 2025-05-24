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
import { FileSystemStoredFile, NestjsFormDataModule } from 'nestjs-form-data';
import { PhrasesModule } from './phrases/phrases.module';
import { Phrase } from './phrases/phrase.model';
import { UserPhrases } from './phrases/user-phrases.model';
import { SubtitlePhrases } from './subtitle/subtitle-phrases.model';
import { Subtitle } from './subtitle/subtitle.model';

@Module({
  controllers: [],
  providers: [],
  imports: [
    NestjsFormDataModule.configAsync({
      useFactory: () => ({
        storage: FileSystemStoredFile,
        fileSystemStoragePath: join(__dirname, '..', 'uploads'),
        autoDeleteFile: true,
      }),
    }),
    ConfigModule.forRoot({
      envFilePath: process.env.NODE_ENV
        ? `.${process.env.NODE_ENV}.env`
        : '.development.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads/',
    }),
    SequelizeModule.forRoot({
      models: [
        Role,
        UserRoles,
        Token,
        User,
        Word,
        UserWords,
        Subtitle,
        Phrase,
        UserPhrases,
        SubtitlePhrases,
      ],
      dialect: 'postgres',
      autoLoadModels: true,
      host: process.env.POSTGRES_HOST,
      database: process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER,
      port: Number(process.env.POSTGRES_PORT),
      password: process.env.POSTGRES_PASSWORD,
      logging: true,
    }),
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
    PhrasesModule,
  ],
})
export class AppModule {
  constructor() {}
}
