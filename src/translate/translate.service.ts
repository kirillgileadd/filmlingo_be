import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { YandexIamTokenService } from 'src/yandex-iam-token/yandex-iam-token.service';

@Injectable()
export class TranslateService {
  private readonly apiUrl: string = process.env.YANDEX_TRANSLATE_URL;

  constructor(
    private readonly httpService: HttpService,
    private readonly yandexIamTokenService: YandexIamTokenService,
  ) {}

  async translateText(text: string, targetLang: string): Promise<string> {
    const token = await this.yandexIamTokenService.getIamToken();
    const url = `${this.apiUrl}`;
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    const data = {
      folderId: process.env.YANDEX_FOLDER_ID,
      texts: [text],
      targetLanguageCode: targetLang,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, data, { headers }),
      );

      return response.data.translations[0].text; // Извлекаем переведенный текст
    } catch (error) {
      console.log(error);
      throw new Error('Error translating text');
    }
  }
}
