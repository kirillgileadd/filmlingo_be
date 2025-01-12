import { Expose } from 'class-transformer';

export class RoleDto {
  @Expose()
  readonly id: number;

  @Expose()
  readonly value: string;

  @Expose()
  readonly description: string;
}
