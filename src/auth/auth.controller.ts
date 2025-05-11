import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { Request, Response } from 'express';
import { ForgotPassUserDto } from './dto/forgot-pass-user.dto';
import { ResetPasswordDto } from './dto/reset-password-dto';
import { AuthGuard } from '@nestjs/passport';
import { LoginUserDto } from './dto/login-user.dto';
import { RegistrationUserDto } from './dto/registration-user.dto';

@ApiTags('Авторизация')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  async login(
    @Body() userDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userData = await this.authService.login(userDto);
    res.cookie('refresh_token', userData.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return userData;
  }

  @Post('/registration')
  async registration(
    @Body() userDto: RegistrationUserDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userData = await this.authService.registration(userDto);
    res.cookie('refresh_token', userData.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
    return userData;
  }

  @Post('/logout')
  async logout(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST, // Пустая кука
          error: 'В куке нет refresh_token',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.logout(refresh_token);
    res.clearCookie('refresh_token');

    return HttpStatus.OK;
  }

  @Get('/activate/:activationLink')
  async activate(
    @Param('activationLink') activationLink,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.activate(activationLink);
    return res.redirect(process.env.APP_URL);
  }

  @Get('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    try {
      const { refresh_token } = req.cookies;
      const userData = await this.authService.refresh(refresh_token);
      res.cookie('refresh_token', userData.refreshToken, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
      return userData;
    } catch (error) {
      return HttpStatus.BAD_REQUEST;
    }
  }

  @Post('/forgot-password')
  async forgotPassword(@Body() userDto: ForgotPassUserDto) {
    return await this.authService.forgotPassword(userDto.email);
  }

  @Post('/reset-password')
  async resetPassword(@Body() userDto: ResetPasswordDto) {
    return await this.authService.resetPassword(userDto);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {}

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res: Response) {
    const user = req.user;
    const userData = await this.authService.setTokens({
      email: user.email,
      id: user.id,
      isActivated: user.isActivated,
      roles: user.roles,
    });

    res.cookie('refresh_token', userData.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie('access_token', userData.accessToken, {
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect(process.env.APP_URL);
  }

  @Get('yandex')
  @UseGuards(AuthGuard('yandex'))
  async yandexLogin() {}

  @Get('yandex/callback')
  @UseGuards(AuthGuard('yandex'))
  async yandexCallback(@Req() req, @Res() res: Response) {
    const user = req.user;

    const userData = await this.authService.setTokens({
      email: user.email,
      id: user.id,
      isActivated: user.isActivated,
      roles: user.roles,
    });

    res.cookie('refresh_token', userData.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie('access_token', userData.accessToken, {
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect(process.env.APP_URL);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req, @Res() res: Response) {
    const user = req.user;

    const userData = await this.authService.setTokens({
      email: user.email,
      id: user.id,
      isActivated: user.isActivated,
      roles: user.roles,
    });

    res.cookie('refresh_token', userData.refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.cookie('access_token', userData.accessToken, {
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect(process.env.APP_URL);
  }
}
