import { Table, Column, Model, DataType, HasMany } from 'sequelize-typescript';
import { VideoVariant } from './video-variant.model';
import { Subtitle } from 'src/subtitle/subtitle.model';

@Table
export class Film extends Model<Film> {
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  posterPath: string; // Путь к обложке фильма на диске

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  bigPosterPath: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  titleImagePath: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  imdb_rating: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  kinopoisk_rating: number;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  year: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  category: string;

  @HasMany(() => VideoVariant)
  videoVariants: VideoVariant[];

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  uploadedAt: Date;

  @HasMany(() => Subtitle)
  subtitles: Subtitle[]; // Связь с субтитрами
}
