import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FileService } from 'src/file/file.service';
import { Subtitle } from 'src/subtitle/subtitle.model';
import { FilmController } from './films.controller';
import { Film } from './films.model';
import { FilmService } from './films.service';
import { VideoVariant } from './video-variant.model';
import { SubtitleModule } from 'src/subtitle/subtitle.module';
import { TokenModule } from 'src/token/token.module';
import { Sequelize } from 'sequelize-typescript';

@Module({
  imports: [
    SequelizeModule.forFeature([Film, VideoVariant, Subtitle]),
    SubtitleModule,
    TokenModule,
  ],
  controllers: [FilmController],
  providers: [
    FilmService,
    FileService,
    {
      provide: 'Sequelize',
      useExisting: Sequelize,
    },
  ],
  exports: [FilmService, 'Sequelize'],
})
export class FilmsModule {}
