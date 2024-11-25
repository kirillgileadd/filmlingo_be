import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Translate')
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  async translate(
    @Body() dto: { text: string; targetLang: string },
  ): Promise<string> {
    if (!dto.text || !dto.targetLang) {
      throw new Error('Text and targetLang parameters are required');
    }
    return this.translateService.translateText(dto.text, dto.targetLang);
  }
}
