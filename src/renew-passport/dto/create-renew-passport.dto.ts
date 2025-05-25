import { IsString, IsDateString, IsEmail, IsOptional } from 'class-validator';
import { PassportDocumentType } from '../../types/renew-passport.types';

export class CreateRenewPassportDto {
  @IsString()
  fullName: string;

  @IsDateString()
  dateOfBirth: string;

  @IsString()
  nicNumber: string;

  @IsString()
  currentPassportNumber: string;

  @IsDateString()
  currentPassportExpiryDate: string;

  @IsString()
  address: string;

  @IsString()
  contactNumber: string;

  @IsEmail()
  email: string;

  @IsOptional()
  documents?: {
    [key in PassportDocumentType]?: string;
  };
}
