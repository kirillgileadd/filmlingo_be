import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Word } from './word.model';
import { User } from '../users/users.model';

@Table({ tableName: 'user_words', createdAt: true, updatedAt: true })
export class UserWords extends Model<UserWords> {
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ForeignKey(() => Word)
  @Column({
    type: DataType.INTEGER,
  })
  wordId: number;

  @BelongsTo(() => Word)
  word: Word;

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
