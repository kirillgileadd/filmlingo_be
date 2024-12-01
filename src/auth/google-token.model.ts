import { ApiProperty } from '@nestjs/swagger';
import { Column, DataType, Model, Table } from 'sequelize-typescript';

@Table({ tableName: 'google-token' })
export class GooogleToken extends Model<GooogleToken> {
  @ApiProperty({ example: '1', description: 'Уникальный идентификатор' })
  @Column({
    type: DataType.INTEGER,
    unique: true,
    autoIncrement: true,
    primaryKey: true,
  })
  id: number;

  @Column({ type: DataType.STRING(1000), allowNull: false })
  refreshToken: string;

  @Column({ type: DataType.STRING(1000), allowNull: false })
  accessToken: string;

  @Column({ type: DataType.FLOAT, allowNull: false })
  expiryDate: number;
}
