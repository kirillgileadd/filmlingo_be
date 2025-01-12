import { Exclude, Expose, Type } from 'class-transformer';
import { RoleDto } from '../../roles/dto/role.dto';

export class UserDto {
  @Expose()
  readonly email: string;
  @Expose()
  readonly id: number;
  @Expose()
  readonly isActivated: boolean;
  @Expose()
  @Type(() => RoleDto)
  readonly roles: RoleDto[];
  @Exclude()
  password?: string;
}
