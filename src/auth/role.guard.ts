import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from '../token/token.service';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles-auth.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private reflector: Reflector,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const requiredRoles = this.reflector.getAllAndOverride<string[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRoles) {
        return true;
      }

      const req = context.switchToHttp().getRequest();
      const authHeader = req.headers.authorization;
      const bearer = authHeader?.split(' ')?.[0];

      const token = authHeader?.split(' ')?.[1];

      if (bearer !== 'Bearer' || !token) {
        throw new ForbiddenException({
          message: 'Access token отсутствует или неверного формата',
        });
      }

      const user = this.tokenService.validateAccessToken(token);

      if (!user) {
        throw new UnauthorizedException({
          message: 'Пользователь не авторизован',
        });
      }

      req.user = user;
      return user.roles.some((role) => requiredRoles.includes(role.value));
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Нет доступа', HttpStatus.FORBIDDEN);
    }
  }
}
