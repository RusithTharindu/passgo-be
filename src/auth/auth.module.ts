import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './entities/user.entity';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) => {
        const secret = ConfigService.get<string>('JWT_SECRET');
        return {
          secret: secret,
          signOptions: { expiresIn: '1d' },
        };
      },
    }),

    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    AuthModule,
  ],
  controllers: [AuthController],
  providers: [
    // TODO: Add JWT Strategy file
    // JwtStategy,
    AuthService,
  ],
})
export class AuthModule {}
