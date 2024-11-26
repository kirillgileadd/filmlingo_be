import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { YandexIamTokenService } from './yandex-iam-token.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [YandexIamTokenService],
  exports: [YandexIamTokenService],
})
export class YandexIamTokenModule {}
