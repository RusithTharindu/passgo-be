import { IsEmail, IsString, Matches, MinLength, IsDateString, IsIn } from 'class-validator';

export class SignUpDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail(
    {},
    {
      message: 'Invalid email',
    },
  )
  email: string;

  @IsString({ message: 'Invalid password' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[0-9])/, { message: 'Password must contain at least one number' })
  password: string;

  @IsString()
  @IsIn(['male', 'female'], { message: 'Gender must be either Male or Female' })
  gender: string;

  @IsDateString({}, { message: 'Birthdate must be a valid date string' })
  birthdate: string;

  @IsString()
  role: string;
}
