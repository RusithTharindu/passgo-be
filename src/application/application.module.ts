import { Module } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Application } from './entities/application.entity';
import { SchemaFactory } from '@nestjs/mongoose';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: SchemaFactory.createForClass(Application) },
    ]),
    AuthModule,
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, RolesGuard],
})
export class ApplicationModule {}
