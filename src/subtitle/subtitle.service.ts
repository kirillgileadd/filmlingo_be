import { Injectable } from '@nestjs/common';
import { Subtitle } from './subtitle.model'; // Импортируйте модель субтитров
import { CreateSubtitleDto } from './dto/create-subtitle.dto'; // Импортируйте DTO для создания субтитра

@Injectable()
export class SubtitleService {
  async addSubtitle(createSubtitleDto: CreateSubtitleDto): Promise<Subtitle> {
    const subtitle = await Subtitle.create(createSubtitleDto);
    return subtitle;
  }

  async getSubtitlesByFilmId(filmId: number): Promise<Subtitle[]> {
    return Subtitle.findAll({ where: { filmId } });
  }

  async deleteSubtitle(subtitleId: number): Promise<void> {
    await Subtitle.destroy({ where: { id: subtitleId } });
  }
}
