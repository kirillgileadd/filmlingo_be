import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { YouTubeService } from './youtube.service';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('YouTube')
@Controller('captions')
export class YouTubeController {
  constructor(private readonly youTubeService: YouTubeService) {}

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
