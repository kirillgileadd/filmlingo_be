import { Module } from '@nestjs/common';
import { WordsService } from './words.service';
import { WordsController } from './words.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Word } from './word.model';
import { UserWords } from './user-words.model';
import { TokenModule } from 'src/token/token.module';
import { User } from 'src/users/users.model';

@Module({
  imports: [SequelizeModule.forFeature([Word, UserWords, User]), TokenModule],
  controllers: [WordsController],
  providers: [WordsService],
})
export class WordsModule {}
