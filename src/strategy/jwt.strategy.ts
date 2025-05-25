/* eslint-disable */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { AuthService } from 'src/auth/auth.service';
import { AuthJwtPayload } from 'src/auth/types/auth-jwtPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const options: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    };
    super(options);
  }

  async validate(payload: AuthJwtPayload) {
    // Return the payload directly instead of finding the user
    return {
      uid: payload.uid,
      role: payload.role,
    };
  }
}
