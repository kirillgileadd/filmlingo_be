import { Module } from '@nestjs/common';
import { PhrasesService } from './phrases.service';
import { PhrasesController } from './phrases.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Phrase } from './phrase.model';
import { UserPhrases } from './user-phrases.model';
import { TokenModule } from 'src/token/token.module';
import { User } from 'src/users/users.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Phrase, UserPhrases, User]),
    TokenModule,
  ],
  controllers: [PhrasesController],
  providers: [PhrasesService],
})
export class PhrasesModule {}
