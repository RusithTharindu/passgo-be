import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { User } from 'src/auth/entities/user.entity';
import * as mongoose from 'mongoose';

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

  @Prop({ default: 'pending', enum: ['pending', 'approved', 'rejected'] })
  status: string;
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);
