import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './s3.service';
import s3Config from '../config/s3.config';

@Module({
  imports: [ConfigModule.forFeature(s3Config)],
  providers: [S3Service],
  exports: [S3Service],
})
export class S3Module {}
