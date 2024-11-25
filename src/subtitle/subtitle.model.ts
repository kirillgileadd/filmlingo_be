import { Column, ForeignKey, Model, Table } from 'sequelize-typescript';
import { Film } from '../films/films.model'; // импортируйте вашу модель Film

@Table
export class Subtitle extends Model<Subtitle> {
  @Column
  path: string; // Путь к файлу субтитров

  @Column
  language: string; // Язык субтитров

  @ForeignKey(() => Film)
  @Column
  filmId: number; // Внешний ключ для связи с фильмом
}
