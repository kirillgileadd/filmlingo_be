import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import axios from 'axios';

@Injectable()
export class YandexIamTokenService implements OnModuleInit {
  private iamToken: string | null = null;
  private tokenExpirationTime: Date | null = null;

  async onModuleInit() {
    await this.refreshIamToken();
  }

  async getIamToken(): Promise<string> {
    if (!this.iamToken || this.isTokenExpired()) {
      await this.refreshIamToken();
    }
    return this.iamToken;
  }

  private isTokenExpired(): boolean {
    if (!this.tokenExpirationTime) {
      return true;
    }
    return new Date() > this.tokenExpirationTime;
  }

  private async refreshIamToken() {
    const yandexOauthToken = process.env.YANDEX_OAUTH_TOKEN; // Храните в development.env
    if (!yandexOauthToken) {
      throw new Error('YANDEX_OAUTH_TOKEN is not set');
    }

    try {
      const response = await axios.post(
        'https://iam.api.cloud.yandex.net/iam/v1/tokens',
        { yandexPassportOauthToken: yandexOauthToken },
      );

      this.iamToken = response.data.iamToken;
      // Устанавливаем время истечения токена с запасом
      const expiresIn = response.data.expiresAt;
      this.tokenExpirationTime = new Date(
        new Date(expiresIn).getTime() - 5 * 60 * 1000,
      );
    } catch (error) {
      console.error('Failed to refresh IAM token:', error);
      throw new Error('Failed to refresh IAM token');
    }
  }

  @Cron('0 */7 * * *') // Обновлять токен каждые 7 часов
  async handleCron() {
    try {
      await this.refreshIamToken();
      console.log('IAM Token refreshed successfully');
    } catch (error) {
      console.error('Error refreshing IAM Token:', error);
    }
  }
}
