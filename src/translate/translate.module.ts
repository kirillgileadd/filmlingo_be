import { HttpModule } from '@nestjs/axios'; 
import { Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateController } from './translate.controller';

@Module({
  imports: [HttpModule],
  providers: [TranslateService],
  controllers: [TranslateController],
})
export class TranslateModule {}
