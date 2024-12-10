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
import { CreateWordDto } from './dto/create-word.dto';
import { UpdateWordDto } from './dto/update-word.dto';
import { WordsService } from './words.service';

@ApiTags('words')
@Controller('words')
export class WordsController {
  constructor(private readonly wordsService: WordsService) {}

  @ApiOperation({ summary: 'Создать слово' })
  @ApiResponse({ status: 201, description: 'Слово успешно создано.' })
  @ApiBody({ type: CreateWordDto })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() createWordDto: CreateWordDto) {
    return this.wordsService.create(createWordDto);
  }

  @ApiOperation({ summary: 'Добавить слово пользователю' })
  @ApiResponse({ status: 201, description: 'Слово добавлено пользователю.' })
  @ApiBody({ type: CreateWordDto })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Post('/add')
  async addWord(@Req() req, @Body() createWordDto: CreateWordDto) {
    const userId = req.user.id;
    return this.wordsService.addWord(userId, createWordDto);
  }

  @Roles('USER')
  @UseGuards(RolesGuard)
  @Get('/find-random')
  async findRandomWords(@Req() req) {
    const userId = req.user.id;
    return this.wordsService.findRandomWords(userId);
  }

  @ApiOperation({ summary: 'Получить все слова' })
  @ApiResponse({ status: 200, description: 'Возвращает список всех слов.' })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.wordsService.findAll();
  }

  @ApiOperation({ summary: 'Получить слова текущего пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Возвращает список слов пользователя.',
  })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Get('/my-words')
  async getUserWords(
    @Req() req,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
    @Query('order') order?: string,
    @Query('orderValue') orderValue?: string,
  ) {
    const userId = req.user.id;

    const pageNumber = parseInt(page, 10) || 1;
    const size = parseInt(pageSize, 10) || 10;

    return this.wordsService.findUsersWords(
      userId,
      pageNumber,
      size,
      order,
      orderValue,
    );
  }

  @ApiOperation({ summary: 'Получить одно слово по ID' })
  @ApiResponse({ status: 200, description: 'Возвращает слово по ID.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID слова' })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wordsService.findOne(+id);
  }

  @ApiOperation({ summary: 'Обновить слово' })
  @ApiResponse({ status: 200, description: 'Слово успешно обновлено.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID слова' })
  @ApiBody({ type: UpdateWordDto })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWordDto: UpdateWordDto) {
    return this.wordsService.update(+id, updateWordDto);
  }

  @ApiOperation({ summary: 'Удалить слово по ID' })
  @ApiResponse({ status: 200, description: 'Слово удалено.' })
  @ApiParam({ name: 'id', type: 'number', description: 'ID слова' })
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.wordsService.remove(+id);
  }

  @ApiOperation({ summary: 'Удалить слово из словаря пользователя' })
  @ApiResponse({
    status: 200,
    description: 'Слово удалено из словаря пользователя.',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID слова' })
  @Roles('USER')
  @UseGuards(RolesGuard)
  @Delete(':id/remove')
  async removeWord(@Req() req, @Param('id') wordId: number) {
    const userId = req.user.id;
    return this.wordsService.removeWord(userId, wordId);
  }
}
