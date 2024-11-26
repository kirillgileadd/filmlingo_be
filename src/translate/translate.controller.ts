import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { TranslateService } from './translate.service';
import { TranslateDto } from './dto/translate.dto';

@ApiTags('Translate')
@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  @ApiOperation({ summary: 'Translate text to the target language' })
  @ApiBody({
    description: 'Provide text and target language for translation',
    type: TranslateDto,
  })
  @ApiResponse({
    status: 200,
    description: 'The translated text is returned',
    type: String,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input: text and targetLang are required',
  })
  async translate(@Body() dto: TranslateDto): Promise<string> {
    if (!dto.text || !dto.targetLang) {
      throw new Error('Text and targetLang parameters are required');
    }
    return this.translateService.translateText(dto.text, dto.targetLang);
  }
}
