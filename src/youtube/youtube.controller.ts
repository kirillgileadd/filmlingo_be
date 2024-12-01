import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { YouTubeService } from './youtube.service';

@ApiTags('YouTube')
@Controller('captions')
export class YouTubeController {
  constructor(private readonly youTubeService: YouTubeService) {}

  @Get('/v2/download/:captionId')
  async getCaptionsFile(@Param('captionId') captionId: string) {
    console.log(captionId, 'captionId');
    const subtitles = await this.youTubeService.getCaptionsFile(captionId);

    return { subtitles };
  }

  @Get('/v2/:videoId')
  async getCaptionsOauth(@Param('videoId') videoId: string) {
    console.log(videoId, 'videoId');
    const subtitles = await this.youTubeService.getCaptions(videoId);

    return { subtitles };
  }

  @Get(':videoURL')
  @ApiOperation({
    summary: 'Получить субтитры для видео по ID',
    description:
      'Данный эндпоинт возвращает субтитры для видео по его ID, если они доступны.',
  })
  @ApiParam({
    name: 'videoURL',
    description: 'ID видео на YouTube для которого нужно получить субтитры',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Субтитры успешно получены',
    schema: {
      example: {
        subtitles:
          '1\n00:00:00,000 --> 00:00:05,000\nПривет! Это тестовое видео для демонстрации субтитров.\n...',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Субтитры не найдены для данного видео',
  })
  async getSubtitles(@Param('videoURL') videoURL: string) {
    const subtitles = await this.youTubeService.getCaptionsList(videoURL);

    return { subtitles };
  }
}
