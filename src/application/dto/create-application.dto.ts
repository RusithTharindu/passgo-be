import { IsBoolean, IsEmail, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum CollectionLocation {
  COLOMBO = 'Colombo',
  KANDY = 'Kandy',
  MATARA = 'Matara',
  VAVUNIYA = 'Vavuniya',
  REGIONAL_OFFICE = 'Regional Office',
}

export enum DocumentType {
  BIRTH_CERTIFICATE = 'birth_certificate',
  NIC = 'nic',
}

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

  @IsEnum(CollectionLocation)
  collectionLocation: CollectionLocation;

  @IsOptional()
  documentVerification?: {
    documentType: DocumentType;
    verified: boolean;
    verificationDate?: Date;
  }[];

  @IsString()
  @IsOptional()
  biometricAppointmentDate?: string;

  @IsString()
  @IsOptional()
  biometricAppointmentTime?: string;

  @IsBoolean()
  @IsOptional()
  photoVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  fingerprintVerified?: boolean;

  @IsString()
  @IsOptional()
  counterNumber?: string;

  @IsNumber()
  @IsOptional()
  paymentAmount?: number;

  @IsString()
  @IsOptional()
  paymentReference?: string;

  @IsString()
  studioPhotoUrl: string;
}
