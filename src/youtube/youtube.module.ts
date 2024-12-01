import { Module } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { YouTubeController } from './youtube.controller';
import { GoogleModule } from 'src/auth/google.module';

@Module({
  imports: [GoogleModule],
  providers: [YouTubeService],
  controllers: [YouTubeController],
})
export class YouTubeModule {}
