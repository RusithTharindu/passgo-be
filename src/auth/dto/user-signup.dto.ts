import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class SignUpDto {
  @IsString()
  name: string;

  @IsEmail(
    {},
    {
      message: 'Invalid email',
    },
  )
  email: string;

  // TODO: Add validation for password using regex
  @IsString({ message: 'Invalid password' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[0-9])/, { message: 'Password must contain at least one number' })
  password: string;

  @IsString()
  role: string;

  // TODO: Add rest of the required fields for signup
}
