import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';
import { Word } from './word.model';
import { User } from '../users/users.model';

@Table({ tableName: 'user_words', createdAt: false, updatedAt: false })
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  userId: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    comment: 'Фраза, из которой добавлено слово',
  })
  phrase: string | null;
}
