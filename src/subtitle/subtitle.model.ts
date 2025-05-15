import {
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Film } from '../films/films.model';
import { Phrase } from '../phrases/phrase.model';
import { SubtitlePhrases } from './subtitle-phrases.model';

@Table({ tableName: 'subtitles' })
export class Subtitle extends Model<Subtitle> {
  @Column
  language: string; // Язык субтитров

  @ForeignKey(() => Film)
  @Column
  filmId: number; // Внешний ключ для связи с фильмом

  @Column({ type: DataType.STRING, allowNull: false })
  startTime: string;

  @Column({ type: DataType.STRING, allowNull: false })
  endTime: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  startSeconds: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  endSeconds: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  text: string;

  // @Column({ type: DataType.JSONB, allowNull: true })
  // phrases: {
  //   original: string;
  //   translate: string;
  //   type: string;
  // }[];

  @BelongsToMany(() => Phrase, () => SubtitlePhrases)
  phrases: Phrase[];
}
