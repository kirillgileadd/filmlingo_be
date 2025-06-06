import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/sequelize';
import { Token } from './token.model';
import { UserDto } from '../users/dto/user.dto';

@Injectable()
export class TokenService {
  constructor(
    @InjectModel(Token) private tokenRepository: typeof Token,
    private jwtService: JwtService,
  ) {}

  generateTokens(userDto: UserDto) {
    try {
      const payload = {
        email: userDto.email,
        id: userDto.id,
        roles: userDto.roles,
      };
      const accessToken = this.jwtService.sign(payload, { expiresIn: '10m' });

      const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
      return { accessToken, refreshToken };
    } catch (e) {
      console.log(e);
    }
  }

  async saveToken(userId: number, refreshToken: string) {
    const tokenData = await this.tokenRepository.findOne({ where: { userId } });

    if (tokenData) {
      const updatedToken = await tokenData.update({ refreshToken });
      return updatedToken;
    }
    const token = await this.tokenRepository.create({
      userId: userId,
      refreshToken,
    });

    return token;
  }

  async removeToken(refreshToken: string) {
    const tokenData = await this.tokenRepository.destroy({
      where: { refreshToken },
    });

    return tokenData;
  }

  async findToken(refreshToken: string) {
    const tokenData = await this.tokenRepository.findOne({
      where: { refreshToken },
    });

    return tokenData;
  }

  validateAccessToken(token: string) {
    try {
      const userData = this.jwtService.verify<UserDto>(token, {
        secret: process.env.TOKEN_SECRET_KEY,
      });
      return userData;
    } catch (e) {
      return null;
    }
  }

  validateRefreshToken(token: string) {
    try {
      const userData = this.jwtService.verify<UserDto>(token, {
        secret: process.env.TOKEN_SECRET_KEY,
      });
      return userData;
    } catch (e) {
      console.log(e);
      return null;
    }
  }
}
