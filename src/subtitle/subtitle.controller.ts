import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
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

  @Get(':filmId')
  async getSubtitles(@Param('filmId') filmId: number): Promise<Subtitle[]> {
    return this.subtitleService.getSubtitlesByFilmId(filmId);
  }

  @Roles('USER')
  @UseGuards(RolesGuard)
  @Delete(':id')
  async deleteSubtitle(@Param('id') id: number): Promise<void> {
    return this.subtitleService.deleteSubtitle(id);
  }
}
