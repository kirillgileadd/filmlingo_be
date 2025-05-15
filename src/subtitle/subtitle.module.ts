import { Module } from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { SubtitleController } from './subtitle.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subtitle } from './subtitle.model'; // Импортируйте модель субтитров
import { SubtitleProcessor } from './subtitle.processor';
import { TokenModule } from 'src/token/token.module';
import { Phrase } from '../phrases/phrase.model';
import { SubtitlePhrases } from './subtitle-phrases.model';

@Module({
  imports: [
    SequelizeModule.forFeature([Subtitle, SubtitlePhrases, Phrase]),
    TokenModule,
  ],
  providers: [SubtitleService, SubtitleProcessor],
  controllers: [SubtitleController],
  exports: [SubtitleService, SubtitleProcessor],
})
export class SubtitleModule {}
