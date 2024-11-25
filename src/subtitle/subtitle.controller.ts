import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { SubtitleService } from './subtitle.service';
import { CreateSubtitleDto } from './dto/create-subtitle.dto'; // Импортируйте DTO для создания субтитра
import { Subtitle } from './subtitle.model';

@Controller('subtitles')
export class SubtitleController {
  constructor(private readonly subtitleService: SubtitleService) {}

  @Post()
  async addSubtitle(
    @Body() createSubtitleDto: CreateSubtitleDto,
  ): Promise<Subtitle> {
    return this.subtitleService.addSubtitle(createSubtitleDto);
  }

  @Get(':filmId')
  async getSubtitles(@Param('filmId') filmId: number): Promise<Subtitle[]> {
    return this.subtitleService.getSubtitlesByFilmId(filmId);
  }

  @Delete(':id')
  async deleteSubtitle(@Param('id') id: number): Promise<void> {
    return this.subtitleService.deleteSubtitle(id);
  }
}
