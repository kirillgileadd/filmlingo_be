import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokenService } from './token.service';
import { HttpException } from '@nestjs/common/exceptions/http.exception';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokenService: TokenService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    try {
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
      return true;
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }

      throw new UnauthorizedException({
        message: 'Пользователь не авторизован',
      });
    }
  }
}
