import { Injectable } from '@nestjs/common';
import { YoutubeTranscript } from './youtube.transcript';

@Injectable()
export class YouTubeService {
  async getCaptionsList(videoId: string) {
    return await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  }
}
