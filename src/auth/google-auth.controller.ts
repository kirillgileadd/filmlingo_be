import { Controller, Get, Query, Redirect, UseGuards } from '@nestjs/common';
import { GoogleAuthService } from './google-auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from './role.guard';
import { Roles } from './roles-auth.decorator';

@ApiTags('admin google auth')
@Controller('auth/admin/google')
export class GoogleAuthController {
  constructor(private readonly googleAuthService: GoogleAuthService) {}

  // Шаг 1: Генерация URL для авторизации
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get('login')
  @Redirect()
  @ApiOperation({ summary: 'Generate Google OAuth authorization URL' })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth login page.',
    schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Google OAuth login URL',
        },
      },
    },
  })
  async login() {
    const url = this.googleAuthService.generateAuthUrl();
    return { url };
  }

  // Шаг 2: Обработка ответа от Google (получаем код и сохраняем токены)
  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Get('callback')
  @ApiOperation({ summary: 'Google OAuth callback, save tokens' })
  @ApiResponse({
    status: 200,
    description: 'Google authorization successful, tokens saved.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request, missing or invalid code.',
  })
  async callback(@Query('code') code: string) {
    await this.googleAuthService.setTokens(code);
    return 'Google authorization successful. Tokens have been saved!';
  }
}
