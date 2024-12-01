import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GooogleToken } from './google-token.model';
import { InjectModel } from '@nestjs/sequelize';

@Injectable()
export class GoogleAuthService {
  private oauth2Client;

  constructor(
    @InjectModel(GooogleToken)
    private readonly googleTokenRep: typeof GooogleToken,
  ) {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
      );
    } catch (e) {
      console.log(e, 'asdfasfasdfERTROR');
    }

    console.log(this.oauth2Client, 'asdf');
  }

  async onModuleInit() {
    this.refreshTokensIfNeeded();
  }

  // Получение токенов из базы данных
  async getTokens() {
    const token = await this.googleTokenRep.findByPk(1);

    if (!token) {
      throw new Error('Tokens not found. Please authorize the application.');
    }

    this.oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    return token;
  }

  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
      redirect_uri: 'http://localhost:3000', // укажи свой URL для callback
    });
  }

  // Обновление токенов
  @Cron(CronExpression.EVERY_6_HOURS)
  async refreshTokensIfNeeded() {
    // const token = await this.googleTokenRep.findByPk(1);
    // if (!token) {
    //   console.log('Google tokens not found. Please authorize the application.');
    //   return;
    // }
    // this.oauth2Client.setCredentials({
    //   access_token: token.accessToken,
    //   refresh_token: token.refreshToken,
    //   expiry_date: token.expiryDate,
    // });
    // if (this.oauth2Client.isTokenExpiring()) {
    //   try {
    //     const newTokens = await this.oauth2Client.refreshAccessToken();
    //     await this.saveTokens(newTokens.credentials);
    //     console.log('Tokens refreshed successfully.');
    //   } catch (error) {
    //     console.error(
    //       'Unable to refresh token. Please reauthorize the application.',
    //     );
    //   }
    // } else {
    //   console.log('Tokens are still valid.');
    // }
  }

  async setTokens(authCode: string) {
    const { tokens } = await this.oauth2Client.getToken(authCode);
    await this.saveTokens(tokens);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  // Сохранение обновленных токенов в базе данных
  private async saveTokens(tokens: any) {
    const { access_token, refresh_token, expiry_date } = tokens;
    await this.googleTokenRep.upsert({
      id: 1,
      accessToken: access_token,
      refreshToken: refresh_token, // Сохраняем новый refresh_token, если он изменился
      expiryDate: expiry_date,
    });
  }

  async getYouTubeClient() {
    console.log(this.oauth2Client, 'oauth2Client');

    return google.youtube({
      version: 'v3',
      auth: this.oauth2Client,
    });
  }
}
