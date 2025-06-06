import { Module } from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { SubtitleController } from './subtitle.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subtitle } from './subtitle.model';
import { SubtitleProcessor } from './subtitle.processor';
import { TokenModule } from 'src/token/token.module';
import { Phrase } from '../phrases/phrase.model';
import { SubtitlePhrases } from './subtitle-phrases.model';
import { Film } from '../films/films.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Film, Subtitle, SubtitlePhrases, Phrase]),
    TokenModule,
  ],
  providers: [SubtitleService, SubtitleProcessor],
  controllers: [SubtitleController],
  exports: [SubtitleService, SubtitleProcessor],
})
export class SubtitleModule {}
