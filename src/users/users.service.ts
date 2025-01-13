import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { v4 as uuidv4 } from 'uuid';
import { Role } from '../roles/roles.model';
import { RolesService } from '../roles/roles.service';
import { AddRoleDto } from './dto/add-role.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './users.model';
import { UpdateUserDto } from './dto/update-user.dto';
import { plainToInstance } from 'class-transformer';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private roleSevice: RolesService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const activationLink: string = uuidv4();
    const user = await this.userRepository.create({
      ...dto,
      activationLink: activationLink,
    });
    const role = await this.roleSevice.getRoleByValue('USER');

    await user.$set('roles', [role.id]);
    user.roles = [role];
    return user;
  }

  async updateUser(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findByPk(id);

    if (!user) {
      throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
    }

    await user.update(dto);
    return user;
  }

  async getAllUsers() {
    const users = await this.userRepository.findAll({
      include: [
        {
          model: Role,
          attributes: ['value', 'id'], // Укажите только те атрибуты, которые вам нужны
          through: { attributes: [] }, // Исключите атрибуты, связанные с промежуточной таблицей
        },
      ],
    });

    return users;
  }

  async getCurrentUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      include: { all: true },
    });

    return plainToInstance(UserProfileDto, user, {
      excludeExtraneousValues: true,
    });
  }

  async getUsersByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email },
      include: { all: true },
    });

    return user;
  }

  async getUserByForgotPasswordLink(token: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { forgotPasswordLink: token },
      include: { all: true },
    });
    return user;
  }

  async getUsersById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      include: { all: true },
    });

    return user;
  }

  async getUsersByActivationLink(activationLink: string) {
    const user = await this.userRepository.findOne({
      where: { activationLink },
      include: { all: true },
    });

    return user || null;
  }

  async addRole(dto: AddRoleDto) {
    const user = await this.userRepository.findByPk(dto.userId, {
      include: { model: Role, as: 'roles' },
    });
    const role = await this.roleSevice.getRoleByValue(dto.value);

    if (role && user) {
      await user.$add('roles', role);
      await user.reload({ include: { model: Role, as: 'roles' } });
      return plainToInstance(UserDto, user, {
        excludeExtraneousValues: true,
      });
    }

    throw new HttpException(
      'Пользователь или роль не найден',
      HttpStatus.NOT_FOUND,
    );
  }

  async ban(dto: BanUserDto) {
    const user = await this.userRepository.findByPk(dto.userId, {
      include: { model: Role, as: 'roles' },
    });
    if (user) {
      await user.update({ banReason: dto.banReason, banned: true });
      return {
        ...plainToInstance(UserDto, user, {
          excludeExtraneousValues: true,
        }),
        banned: true,
        banReason: dto.banReason,
      };
    }

    throw new HttpException('Пользователь не найден', HttpStatus.NOT_FOUND);
  }
}
