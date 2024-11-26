import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateController } from './translate.controller';
import { YandexIamTokenModule } from 'src/yandex-iam-token/yandex-iam-token.module';

@Module({
  imports: [HttpModule, YandexIamTokenModule],
  providers: [TranslateService],
  controllers: [TranslateController],
})
export class TranslateModule {}
