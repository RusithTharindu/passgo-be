import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/auth/entities/user.entity';
import * as mongoose from 'mongoose';

export enum ApplicationStatus {
  SUBMITTED = 'submitted', // Application submitted
  PAYMENT_PENDING = 'payment_pending', // Payment not completed
  PAYMENT_VERIFIED = 'payment_verified', // Payment verified
  COUNTER_VERIFICATION = 'counter_verification', // Initial counter verification
  BIOMETRICS_PENDING = 'biometrics_pending', // Waiting for photo/fingerprint capture
  BIOMETRICS_COMPLETED = 'biometrics_completed', // Photo/fingerprint captured
  CONTROLLER_REVIEW = 'controller_review', // Under controller's review
  SENIOR_OFFICER_REVIEW = 'senior_officer_review', // Under senior officer review
  DATA_ENTRY = 'data_entry', // Data entry stage
  PRINTING_PENDING = 'printing_pending', // Ready for printing
  PRINTING = 'printing', // Currently printing
  QUALITY_ASSURANCE = 'quality_assurance', // QA check
  READY_FOR_COLLECTION = 'ready_for_collection', // Ready to be collected
  COLLECTED = 'collected', // Passport collected
  REJECTED = 'rejected', // Application rejected
  ON_HOLD = 'on_hold', // Application on hold for additional verification
}

export interface StatusHistory {
  status: ApplicationStatus;
  timestamp: Date;
  comment?: string;
}

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Application extends Document {
  @Prop({ required: true, enum: ['normal', 'oneDay'] })
  typeOfService: string;

  @Prop({
    required: true,
    enum: ['all', 'middleEast', 'emergencyCertificate', 'identityCertificate'],
  })
  TypeofTravelDocument: string;

  @Prop()
  presentTravelDocument: string;

  @Prop()
  nmrpNumber: string;

  @Prop({ required: true })
  nationalIdentityCardNumber: string;

  @Prop({ required: true })
  surname: string;

  @Prop({ required: true })
  otherNames: string;

  @Prop({ required: true })
  permanentAddress: string;

  @Prop({ required: true })
  permenantAddressDistrict: string;

  @Prop({ required: true })
  birthdate: string;

  @Prop({ required: true })
  birthCertificateNumber: string;

  @Prop({ required: true })
  birthCertificateDistrict: string;

  @Prop({ required: true })
  placeOfBirth: string;

  @Prop({ required: true, enum: ['male', 'female'] })
  sex: string;

  @Prop({ required: true })
  profession: string;

  @Prop({ required: true, default: false })
  isDualCitizen: boolean;

  @Prop()
  dualCitizeshipNumber: string;

  @Prop({ required: true })
  mobileNumber: string;

  @Prop({ required: true })
  emailAddress: string;

  @Prop()
  foreignNationality: string;

  @Prop()
  foreignPassportNumber: string;

  @Prop({ default: false })
  isChild: boolean;

  @Prop()
  childFatherPassportNumber: string;

  @Prop()
  childMotherPassportNumber: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  submittedBy: User;

  @Prop({
    type: String,
    enum: Object.values(ApplicationStatus),
    default: ApplicationStatus.SUBMITTED,
  })
  status: ApplicationStatus;

  @Prop([
    {
      status: { type: String, enum: Object.values(ApplicationStatus) },
      timestamp: { type: Date },
      comment: { type: String },
    },
  ])
  statusHistory: StatusHistory[];

  @Prop()
  expectedCompletionDate?: Date;

  @Prop()
  appointmentDate?: Date;

  @Prop()
  appointmentTime?: string;

  @Prop()
  rejectionReason?: string;

  @Prop({ type: Number })
  paymentAmount?: number;

  @Prop()
  paymentReference?: string;

  @Prop()
  passportNumber?: string;

  @Prop({ enum: ['Colombo', 'Kandy', 'Matara', 'Vavuniya', 'Regional Office'] })
  collectionLocation: string;

  @Prop([
    {
      documentType: {
        type: String,
        enum: ['birth_certificate', 'nic'],
      },
      verified: { type: Boolean, default: false },
      verificationDate: { type: Date },
    },
  ])
  documentVerification: {
    documentType: string;
    verified: boolean;
    verificationDate?: Date;
  }[];

  @Prop()
  biometricAppointmentDate?: Date;

  @Prop()
  biometricAppointmentTime?: string;

  @Prop({ type: Boolean, default: false })
  photoVerified: boolean;

  @Prop({ type: Boolean, default: false })
  fingerprintVerified?: boolean;

  @Prop({ required: true })
  studioPhotoUrl: string;

  @Prop()
  counterNumber: string;

  @Prop({
    type: {
      front: String,
      back: String,
    },
    required: true,
  })
  nicPhotos: {
    front: string;
    back: string;
  };

  @Prop({
    type: {
      front: String,
      back: String,
    },
    required: true,
  })
  birthCertificatePhotos: {
    front: string;
    back: string;
  };

  @Prop({ required: true })
  userPhoto: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
