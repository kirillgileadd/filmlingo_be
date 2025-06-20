import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateController } from './translate.controller';
import { YandexIamTokenModule } from 'src/yandex-iam-token/yandex-iam-token.module';
import { TokenModule } from 'src/token/token.module';

@Module({
  imports: [HttpModule, YandexIamTokenModule, TokenModule],
  providers: [TranslateService],
  controllers: [TranslateController],
})
export class TranslateModule {}
