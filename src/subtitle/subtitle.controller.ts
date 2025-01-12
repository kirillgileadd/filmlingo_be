import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { CreateSubtitleDto } from './dto/create-subtitle.dto'; // Импортируйте DTO для создания субтитра
import { Subtitle } from './subtitle.model';
import { Roles } from 'src/auth/roles-auth.decorator';
import { RolesGuard } from 'src/auth/role.guard';

@Controller('subtitles')
export class SubtitleController {
  constructor(private readonly subtitleService: SubtitleService) {}

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  async addSubtitle(
    @Body() createSubtitleDto: CreateSubtitleDto,
  ): Promise<Subtitle> {
    return this.subtitleService.addSubtitle(createSubtitleDto);
  }

  @Get()
  async getSubtitles(
    @Query('filmId') filmId: number,
    @Query('language') language?: string,
  ): Promise<Subtitle[]> {
    return this.subtitleService.getSubtitlesByFilmId(filmId, language);
  }

  @Get('/youtube')
  async getYoutubeSubtitles(
    @Query('videoId') videoId: string,
    @Query('language') language = 'en',
  ) {
    return this.subtitleService.getYoutubeSubtitles(videoId, language);
  }

  @Roles('USER')
  @UseGuards(RolesGuard)
  @Delete(':id')
  async deleteSubtitle(@Param('id') id: number): Promise<void> {
    return this.subtitleService.deleteSubtitle(id);
  }
}
