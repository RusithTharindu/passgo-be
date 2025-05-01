import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { RenewPassportStatus, PassportDocumentType } from '../../types/renew-passport.types';
import * as mongoose from 'mongoose';
import { User } from '../../auth/entities/user.entity';

@Schema({ timestamps: true })
export class RenewPassport extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true })
  dateOfBirth: Date;

  @Prop({ required: true })
  nicNumber: string;

  @Prop({ required: true })
  currentPassportNumber: string;

  @Prop({ required: true })
  currentPassportExpiryDate: Date;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  contactNumber: string;

  @Prop({ required: true })
  email: string;

  @Prop({ type: Object, default: {} })
  documents: {
    [key in PassportDocumentType]?: string;
  };

  @Prop({ type: String, enum: RenewPassportStatus, default: RenewPassportStatus.PENDING })
  status: RenewPassportStatus;

  @Prop()
  adminRemarks?: string;

  @Prop()
  verifiedAt?: Date;

  @Prop()
  verifiedBy?: string;
}

export const RenewPassportSchema = SchemaFactory.createForClass(RenewPassport);
