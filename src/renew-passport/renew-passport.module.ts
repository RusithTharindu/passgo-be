import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RenewPassportService } from './renew-passport.service';
import { RenewPassportController } from './renew-passport.controller';
import { RenewPassport, RenewPassportSchema } from './schemas/renew-passport.schema';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: RenewPassport.name, schema: RenewPassportSchema }]),
    S3Module,
  ],
  controllers: [RenewPassportController],
  providers: [RenewPassportService],
  exports: [RenewPassportService],
})
export class RenewPassportModule {}
