import { Module } from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { SubtitleController } from './subtitle.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Subtitle } from './subtitle.model'; // Импортируйте модель субтитров

@Module({
  imports: [SequelizeModule.forFeature([Subtitle])],
  providers: [SubtitleService],
  controllers: [SubtitleController],
  exports: [SubtitleService],
})
export class SubtitleModule {}
