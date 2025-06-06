import {
  Column,
  ForeignKey,
  Model,
  Table,
  BelongsTo,
} from 'sequelize-typescript';
import { Subtitle } from './subtitle.model';
import { Phrase } from '../phrases/phrase.model';

@Table({ tableName: 'subtitle_phrases' })
export class SubtitlePhrases extends Model<SubtitlePhrases> {
  @ForeignKey(() => Subtitle)
  @Column({
    onDelete: 'CASCADE',
  })
  subtitleId: number;

  @ForeignKey(() => Phrase)
  @Column({
    onDelete: 'CASCADE',
  })
  phraseId: number;

  @BelongsTo(() => Subtitle, { onDelete: 'CASCADE' })
  subtitle: Subtitle;

  @BelongsTo(() => Phrase, { onDelete: 'CASCADE' })
  phrase: Phrase;
}
