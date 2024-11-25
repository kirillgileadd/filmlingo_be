import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FileModule } from 'src/file/file.module';
import { Film } from './films.model';
import { FilmService } from './films.service';
import { FilmController } from './films.controller';
import { VideoVariant } from './video-variant.model';
import { Subtitle } from 'src/subtitle/subtitle.model';
import { FileService } from 'src/file/file.service';

@Module({
  imports: [SequelizeModule.forFeature([Film, VideoVariant, Subtitle])],
  controllers: [FilmController],
  providers: [FilmService, FileService],
  exports: [FilmService],
})
export class FilmsModule {}
