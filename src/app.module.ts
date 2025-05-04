import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { MongooseModule } from '@nestjs/mongoose';
import config from './config/config';
import { PassportModule } from '@nestjs/passport';
import { ApplicationModule } from './application/application.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { RenewPassportModule } from './renew-passport/renew-passport.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available globally
      cache: true,
      load: [config],
      envFilePath: ['.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('database.connectionString');
        console.log('Connecting to MongoDB:', uri);
        return { uri };
      },
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    AuthModule,
    UserModule,
    ApplicationModule,
    AppointmentsModule,
    RenewPassportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
