import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/role.guard';
import { Roles } from 'src/auth/roles-auth.decorator';
import { CreatePhraseDto } from './dto/create-phrase.dto';
import { UpdatePhraseDto } from './dto/update-phrase.dto';
import { PhrasesService } from './phrases.service';
import { GetUserPhrasesQueryDto } from './dto/get-phrases-query.dto';

@ApiTags('phrases')
@Controller('phrases')
export class PhrasesController {
  constructor(private readonly phrasesService: PhrasesService) {}

  @ApiOperation({ summary: 'Создать фразу' })
  @ApiResponse({ status: 201, description: 'Фраза успешно создано.' })
  @ApiBody({ type: CreatePhraseDto })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() createPhraseDto: CreatePhraseDto) {
    return this.phrasesService.create(createPhraseDto);
  }

  @ApiOperation({ summary: 'Добавить фразу пользователю' })
  @ApiResponse({ status: 201, description: 'Фраза добавлено пользователю.' })
  @ApiBody({ type: CreatePhraseDto })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Post('/add')
  async addPhrase(@Req() req, @Body() createPhraseDto: CreatePhraseDto) {
    const userId = req.user.id;
    return this.phrasesService.addPhrase(userId, createPhraseDto);
  }

  @Roles('USER')
  @UseGuards(RolesGuard)
  @Get('/find-random')
  async findRandomPhrases(@Req() req) {
    const userId = req.user.id;
    return this.phrasesService.findRandomPhrases(userId);
  }

  @ApiOperation({ summary: 'Получить все фразы' })
  @ApiResponse({ status: 200, description: 'Возвращает список всех фраз.' })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.phrasesService.findAll();
  }

  @ApiOperation({ summary: 'Получить фразы текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список фраз пользователя.',
  })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Get('/my-phrases')
  async getUserPhrases(@Req() req, @Query() query: GetUserPhrasesQueryDto) {
    const userId = req.user.id;

    const pageNumber = parseInt(query.page, 10) || 1;
    const size = parseInt(query.pageSize) || 10;

    return this.phrasesService.findUsersPhrases(
      userId,
      pageNumber,
      size,
      query.order,
      query.orderValue,
    );
  }

  @ApiOperation({ summary: 'Получить одно фразу по ID' })
  @ApiResponse({ status: 200, description: 'Возвращает фразу по ID.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID фразы' })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.phrasesService.findOne(+id);
  }

  @ApiOperation({ summary: 'Обновить фразу' })
  @ApiResponse({ status: 200, description: 'Фраза успешно обновлена.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID фразы' })
  @ApiBody({ type: UpdatePhraseDto })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhraseDto: UpdatePhraseDto) {
    return this.phrasesService.update(+id, updatePhraseDto);
  }

  @ApiOperation({ summary: 'Удалить фразу по ID' })
  @ApiResponse({ status: 200, description: 'Фраза удалена.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID фразы' })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.phrasesService.remove(+id);
  }

  @ApiOperation({ summary: 'Удалить фразу из словаря пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Фраза удалена из словаря пользователя.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID фразы' })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Delete(':id/remove')
  async removePhrase(@Req() req, @Param('id') phraseId: number) {
    const userId = req.user.id;
    return this.phrasesService.removePhrase(userId, phraseId);
  }
}
