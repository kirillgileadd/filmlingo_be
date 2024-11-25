import { Role } from '../../roles/roles.model';

export class UserDto {
  readonly email: string;
  readonly id: number;
  readonly isActivated: boolean;
  readonly roles: Role[];
}
