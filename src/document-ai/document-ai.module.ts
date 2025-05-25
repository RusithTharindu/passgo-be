import { Module } from '@nestjs/common';
import { DocumentAiController } from './document-ai.controller';
import { DocumentAiService } from './document-ai.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [DocumentAiController],
  providers: [DocumentAiService],
  exports: [DocumentAiService],
})
export class DocumentAiModule {}
