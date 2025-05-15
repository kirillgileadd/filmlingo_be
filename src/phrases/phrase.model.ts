import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsToMany,
  Column,
  DataType,
  Table,
  Model,
} from 'sequelize-typescript';
import { User } from 'src/users/users.model';
import { UserPhrases } from './user-phrases.model';
import { Subtitle } from '../subtitle/subtitle.model';
import { SubtitlePhrases } from '../subtitle/subtitle-phrases.model';

interface PhraseCreationAttrs {
  original: string;
  translation: string;
  type: 'idiom' | 'phrasal_verb';
}

@Table({ tableName: 'phrases' })
export class Phrase extends Model<Phrase, PhraseCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  original: string;

  @Column({ type: DataType.STRING, allowNull: false })
  translation: string;

  @Column({ type: DataType.STRING, allowNull: false })
  type: 'idiom' | 'phrasal_verb';

  @BelongsToMany(() => User, () => UserPhrases)
  users: User[];

  @BelongsToMany(() => Subtitle, () => SubtitlePhrases)
  subtitles: Subtitle[];
}
