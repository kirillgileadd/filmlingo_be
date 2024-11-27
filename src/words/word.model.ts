import { ApiProperty } from '@nestjs/swagger';
import {
  BelongsToMany,
  Column,
  DataType,
  Table,
  Model,
} from 'sequelize-typescript';
import { User } from 'src/users/users.model';
import { UserWords } from './user-words.model';

interface WordCreationAttrs {
  original: string;
  translation: string;
}

@Table({ tableName: 'words' })
export class Word extends Model<Word, WordCreationAttrs> {
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

  @BelongsToMany(() => User, () => UserWords)
  users: User[];
}
