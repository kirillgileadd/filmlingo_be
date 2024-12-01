import { Injectable } from '@nestjs/common';
import { YoutubeTranscript } from './youtube.transcript';
import { GoogleAuthService } from 'src/auth/google-auth.service';

@Injectable()
export class YouTubeService {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  async getCaptionsList(videoId: string) {
    return await YoutubeTranscript.fetchTranscript(videoId, { lang: 'en' });
  }

  async getCaptions(videoId: string) {
    try {
      console.log('Fetching captions for video ID:', videoId);

      const youtube = await this.googleAuthService.getYouTubeClient();

      // Исправление ошибки с параметрами
      const response = await youtube.captions.list({
        part: ['snippet'], // Массив строк для параметра 'part'
        videoId, // Параметр 'videoId' без явного указания типа
      });

      if (response.data.items && response.data.items.length > 0) {
        console.log('Captions found:', response.data.items);
        return response.data.items;
      } else {
        console.log('No captions found for this video.');
        return [];
      }
    } catch (error) {
      console.error('Error fetching captions:', error);
      throw new Error('Failed to fetch captions');
    }
  }

  async downloadCaption(captionId: string) {
    const youtube = await this.googleAuthService.getYouTubeClient();
    const response = await youtube.captions.download({
      id: captionId,
      tfmt: 'srt',
    });
    return response.data;
  }

  async getCaptionsFile(captionId: string) {
    try {
      const youtube = await this.googleAuthService.getYouTubeClient();

      const response = await youtube.captions.download({
        id: captionId,
        tfmt: 'srt', // Формат субтитров. Можно указать 'srt', 'vtt' или другие поддерживаемые форматы
      });

      const subtitles = response.data;
      return subtitles;
    } catch (error) {
      console.error('Error fetching captions file:', error);
      throw new Error('Failed to fetch captions file');
    }
  }
}
