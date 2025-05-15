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
  @Column
  subtitleId: number;

  @ForeignKey(() => Phrase)
  @Column
  phraseId: number;

  @BelongsTo(() => Subtitle)
  subtitle: Subtitle;

  @BelongsTo(() => Phrase)
  phrase: Phrase;
}
