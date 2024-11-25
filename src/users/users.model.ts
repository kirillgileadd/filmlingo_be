import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../roles/roles.model';
import { UserRoles } from '../roles/user-roles.model';
import { Token } from '../token/token.model';

interface UserCreationAttrs {
  email: string;
  password: string;
  activationLink: string;
}

@Table({ tableName: 'users' })
export class User extends Model<User, UserCreationAttrs> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @ApiProperty({
    example: 'email@mail.ru',
    description: 'Email',
  })
  @Column({
    type: DataType.STRING,
    unique: true,
    allowNull: false,
  })
  email: string;

  @ApiProperty({
    example: 'Кирилл',
    description: 'username',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  username: string;

  @ApiProperty({
    example: 'http://yrl.test',
    description: 'Фото',
  })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  photo: string;

  @ApiProperty({ example: '12345', description: 'Пароль' })
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password: string;

  @ApiProperty({ example: false, description: 'Поле отвечате за бан' })
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  banned: boolean;

  @ApiProperty({ example: 'пнх', description: 'Причина бана' })
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  banReason: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isActivated: boolean;

  @Column({
    type: DataType.STRING,
  })
  activationLink: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  forgotPasswordLink: string;

  @BelongsToMany(() => Role, () => UserRoles)
  roles: Role[];

  @HasOne(() => Token)
  token: Token;
}
