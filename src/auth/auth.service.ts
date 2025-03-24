import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';
import { SignUpDto } from './dto/user-signup.dto';
import { UserLoginDto } from './dto/user-login.dto';
import { AuthJwtPayload } from './types/auth-jwtPayload';
import * as bcrypt from 'bcrypt';
import { InjectModel } from '@nestjs/mongoose';

// TODO: Fill the required Login and SignUp Properties

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private UserModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  // register a new user
  async signup(signupData: SignUpDto) {
    const { email, name, password, role } = signupData;

    const emailInUse = await this.UserModel.findOne({ email });

    if (emailInUse) {
      throw new BadRequestException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.UserModel.create({
      email,
      name,
      password: hashedPassword,
      role,
    });

    return 'User registered successfully';
  }

  // login a user
  async login(loginData: UserLoginDto) {
    const { email, password } = loginData;

    const user = await this.UserModel.findOne({ email });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'inactive') {
      throw new UnauthorizedException('Your account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    return this.generateTokens(user.id, user.role);
  }

  async generateTokens(userId: string, role: string) {
    const payload: AuthJwtPayload = { uid: userId, role };
    const accessToken = await this.jwtService.signAsync(payload); // Signs the JWT token

    return {
      accessToken,
    };
  }

  async findById(id: string) {
    return this.UserModel.findById(id);
  }
}

// TODO: Implement the InjectModel function and what is this ?
// function InjectModel(name: any): (target: typeof AuthService, propertyKey: undefined, parameterIndex: 0) => void {
//   throw new Error('Function not implemented.');
// }
