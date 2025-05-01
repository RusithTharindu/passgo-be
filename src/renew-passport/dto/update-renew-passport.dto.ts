import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { RenewPassportStatus } from '../../types/renew-passport.types';

export class UpdateRenewPassportDto {
  @IsOptional()
  @IsEnum(RenewPassportStatus)
  status?: RenewPassportStatus;

  @IsOptional()
  @IsString()
  adminRemarks?: string;

  @IsOptional()
  @IsDateString()
  verifiedAt?: string;

  @IsOptional()
  @IsString()
  verifiedBy?: string;
}
