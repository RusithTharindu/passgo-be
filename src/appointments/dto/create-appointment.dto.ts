import { IsString, IsEnum, IsDateString, IsNotEmpty } from 'class-validator';
import { AppointmentLocation } from '../entities/appointment.entity';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  permanentAddress: string;

  @IsString()
  @IsNotEmpty()
  nicNumber: string;

  @IsString()
  @IsNotEmpty()
  contactNumber: string;

  @IsEnum(AppointmentLocation)
  preferredLocation: AppointmentLocation;

  @IsDateString()
  preferredDate: string;

  @IsString()
  @IsNotEmpty()
  preferredTime: string;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
