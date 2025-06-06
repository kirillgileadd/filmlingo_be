import {
  BelongsTo,
  Column,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Film } from './films.model';

@Table
export class VideoVariant extends Model<VideoVariant> {
  @ForeignKey(() => Film)
  @Column
  filmId: number;

  @Column
  resolution: string;

  @Column
  videoPath: string;

  @BelongsTo(() => Film, { onDelete: 'CASCADE', hooks: true })
  film: Film;
}
