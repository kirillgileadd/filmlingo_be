import { Module } from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { SubtitleController } from './subtitle.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subtitle } from './subtitle.model'; // Импортируйте модель субтитров
import { SubtitleProcessor } from './subtitle.processor';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [SequelizeModule.forFeature([Subtitle]), TokenModule],
  providers: [SubtitleService, SubtitleProcessor],
  controllers: [SubtitleController],
  exports: [SubtitleService, SubtitleProcessor],
})
export class SubtitleModule {}
