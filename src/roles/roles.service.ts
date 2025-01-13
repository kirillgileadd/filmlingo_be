import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './roles.model';

@Injectable()
export class RolesService {
  constructor(@InjectModel(Role) private roleRepository: typeof Role) {}

  async createRole(dto: CreateRoleDto) {
    const role = await this.getRoleByValue(dto.value);

    if (!role) {
      const role = await this.roleRepository.create(dto);
      return role;
    }

    throw new HttpException(
      'Такая роль уже существует',
      HttpStatus.BAD_REQUEST,
    );
  }

  async getRoleByValue(value: string) {
    const role = await this.roleRepository.findOne({ where: { value } });

    return role;
  }
}
