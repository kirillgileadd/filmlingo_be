import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { YouTubeController } from './youtube.controller';
import { GoogleModule } from 'src/auth/google.module';
import { SubtitleProcessor } from '../subtitle/subtitle.processor';

@Module({
  imports: [GoogleModule],
  providers: [YouTubeService, SubtitleProcessor],
  controllers: [YouTubeController],
})
export class YouTubeModule {}
