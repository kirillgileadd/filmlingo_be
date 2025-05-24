import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Phrase } from './phrase.model';
import { User } from '../users/users.model';

@Table({ tableName: 'user_phrases', createdAt: true, updatedAt: true })
export class UserPhrases extends Model<UserPhrases> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Phrase)
  @Column({
    type: DataType.INTEGER,
  })
  phraseId: number;

  @BelongsTo(() => Phrase)
  phrase: Phrase;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Контекст или место, откуда добавлено слово',
  })
  sourceContext: string | null;
}
