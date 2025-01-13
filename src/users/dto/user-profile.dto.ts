import { Exclude, Expose, Type } from 'class-transformer';
import { RoleDto } from '../../roles/dto/role.dto';

export class UserProfileDto {
  @Expose()
  readonly email: string;
  @Expose()
  readonly id: number;
  @Expose()
  readonly isActivated: boolean;
  @Expose()
  @Type(() => RoleDto)
  readonly roles: RoleDto[];
  @Expose()
  username: string | null;
  @Expose()
  photo: string | null;
  @Expose()
  banned: boolean | null;
  @Expose()
  banReason: string | null;
  @Exclude()
  password?: string;
}
