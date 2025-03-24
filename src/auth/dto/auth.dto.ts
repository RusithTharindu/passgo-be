import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role } from 'src/enums/user.enum';

export class SignUpDto {
  @ApiProperty({ description: 'Name of the user', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'Email of the user',
    example: 'examplemail@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Date of birth of the user in YYYY-MM-DD format',
    example: '1990-01-01',
  })
  @IsString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({
    description: 'Role of the user',
    enum: Role,
    example: Role.APPLICANT,
  })
  @IsString()
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({
    description: 'Profile image of the user',
    example: 'https://example.com/profile.jpg',
  })
  @IsString()
  @IsOptional()
  profileImage?: string;
}

export class normalUserSignUpDto extends SignUpDto {
  @ApiProperty({
    description: 'OTP of the user',
    example: '123456',
  })
  @IsString()
  @IsNotEmpty({
    message: 'OTP is Required',
  })
  otp: string;
}

export class SignInDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'examplemail@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password of the user',
    example: 'password',
  })
  @IsString()
  password: string;
}

export class GetOtpDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'examplemail@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: Role,
    example: Role.APPLICANT,
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'New password of the user',
    example: 'newpassword',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: 'Token for password reset',
    example: 'token',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'example@email.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'Role of the user',
    enum: Role,
    example: Role.APPLICANT,
  })
  @IsString()
  role: Role;

  @ApiProperty({
    description: 'Use case for password reset',
    enum: ['createAccount', 'forgetPassword'],
    example: 'forgetPassword',
  })
  @IsString()
  @IsEnum(['createAccount', 'forgetPassword'] as const)
  useCase: 'createAccount' | 'forgetPassword';
}
