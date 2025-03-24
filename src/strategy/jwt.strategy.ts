// import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { PassportStrategy } from '@nestjs/passport';
// import { ExtractJwt, Strategy } from 'passport-jwt';
// import { ConfigService } from '@nestjs/config';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User } from './entities/user.entity';

// @Injectable()
// export class JwtStrategy extends PassportStrategy(Strategy) {
//   constructor(
//     private configService: ConfigService,
//     @InjectModel('User') private readonly userModel: Model<User>,
//   ) {
//     super({
//       jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
//       secretOrKey: configService.get<string>('JWT_SECRET'),
//     });
//   }

//   async validate(payload: any) {
//     const { id } = payload;
//     const user = await this.userModel.findById(id);

//     if (!user) {
//       throw new UnauthorizedException('Login first to access this endpoint.');
//     }

//     return user;
//   }
// }
