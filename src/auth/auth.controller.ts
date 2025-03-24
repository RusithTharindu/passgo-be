import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RolesGuard } from './guards/roles/roles.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { Roles } from './decorators/roles.decorators';
import { Role } from 'src/enums/user.enum';
import { SignUpDto } from './dto/user-signup.dto';
import { UserLoginDto } from './dto/user-login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST Signup (/auth/signup)
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles(Role.ADMIN)
  @Post('signup')
  async signup(@Body() signupData: SignUpDto) {
    return this.authService.signup(signupData);
  }

  // POST Login (/auth/login)
  @Post('login')
  async login(@Body() loginData: UserLoginDto) {
    return this.authService.login(loginData);
  }

  //This is a test route
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.APPLICANT)
  @Post('test')
  test() {
    return 'This is a test route';
  }
}
