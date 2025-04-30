import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadService } from './upload.service';
import uploadConfig from '../config/upload.config';

@Module({
  imports: [ConfigModule.forFeature(uploadConfig)],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}
