import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from 'src/enums/user.enum';

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User extends Document {
  @Prop({ required: true, type: String })
  firstName: string;

  @Prop({ required: true, type: String })
  lastName: string;

  @Prop({ required: true, type: String })
  email: string;

  @Prop({ required: true, type: String })
  password: string;

  @Prop({ required: true, type: String, enum: ['male', 'female'] })
  gender: string;

  @Prop({ required: true, type: String })
  birthdate: string;

  @Prop({ default: Role.APPLICANT, enum: Role, type: String })
  role: Role;

  @Prop({
    type: String,
    default: 'active',
    enum: ['active', 'inactive'],
    required: false,
  })
  status: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
