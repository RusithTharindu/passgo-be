import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateApplicationDto {
  @IsEnum(['normal', 'oneDay'])
  typeOfService: string;

  @IsEnum(['all', 'middleEast', 'emergencyCertificate', 'identityCertificate'])
  TypeofTravelDocument: string;

  @IsString()
  @IsOptional()
  presentTravelDocument?: string;

  @IsString()
  @IsOptional()
  nmrpNumber?: string;

  @IsString()
  nationalIdentityCardNumber: string;

  @IsString()
  surname: string;

  @IsString()
  otherNames: string;

  @IsString()
  permanentAddress: string;

  @IsString()
  permenantAddressDistrict: string;

  @IsString()
  birthdate: string;

  @IsString()
  birthCertificateNumber: string;

  @IsString()
  birthCertificateDistrict: string;

  @IsString()
  placeOfBirth: string;

  @IsEnum(['male', 'female'])
  sex: string;

  @IsString()
  profession: string;

  @IsBoolean()
  isDualCitizen: boolean;

  @IsString()
  @IsOptional()
  dualCitizeshipNumber?: string;

  @IsString()
  mobileNumber: string;

  @IsEmail()
  emailAddress: string;

  @IsString()
  @IsOptional()
  foreignNationality?: string;

  @IsString()
  @IsOptional()
  foreignPassportNumber?: string;

  @IsBoolean()
  @IsOptional()
  isChild?: boolean;

  @IsString()
  @IsOptional()
  childFatherPassportNumber?: string;

  @IsString()
  @IsOptional()
  childMotherPassportNumber?: string;
}
