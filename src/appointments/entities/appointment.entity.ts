import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from 'src/auth/entities/user.entity';

export enum AppointmentLocation {
  COLOMBO = 'Colombo',
  KANDY = 'Kandy',
  MATARA = 'Matara',
  VAVUNIYA = 'Vavuniya',
  REGIONAL_OFFICE = 'Regional Office',
}

export enum AppointmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class Appointment extends Document {
  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  permanentAddress: string;

  @Prop({ required: true })
  nicNumber: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop({ required: true, enum: AppointmentLocation })
  preferredLocation: AppointmentLocation;

  @Prop({ required: true, type: Date })
  preferredDate: Date;

  @Prop({ required: true })
  preferredTime: string;

  @Prop({ required: true })
  reason: string;

  @Prop({
    type: String,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.PENDING,
  })
  status: AppointmentStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  createdBy: User;

  @Prop()
  rejectionReason?: string;

  @Prop()
  adminNotes?: string;

  @Prop({ type: Boolean, default: false })
  isTimeSlotConfirmed: boolean;
}
