import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { Application, ApplicationSchema } from './entities/application.entity';
// import { SchemaFactory } from '@nestjs/mongoose';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { AuthModule } from '../auth/auth.module';
import { S3Module } from '../s3/s3.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Application.name, schema: ApplicationSchema }]),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 60 seconds
          limit: 5,
        },
      ],
    }),
    AuthModule,
    S3Module,
    UploadModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, RolesGuard],
})
export class ApplicationModule {}
