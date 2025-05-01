import { Document } from 'mongoose';

export enum RenewPassportStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

export enum PassportDocumentType {
  CURRENT_PASSPORT = 'current-passport',
  NIC_FRONT = 'nic-front',
  NIC_BACK = 'nic-back',
  BIRTH_CERT = 'birth-certificate',
  PHOTO = 'passport-photo',
  ADDITIONAL_DOCS = 'additional-documents',
}

export interface RenewPassportDocument extends Document {
  userId: string;
  fullName: string;
  dateOfBirth: Date;
  nicNumber: string;
  currentPassportNumber: string;
  currentPassportExpiryDate: Date;
  address: string;
  contactNumber: string;
  email: string;
  documents: {
    [key in PassportDocumentType]?: string; // S3 keys
  };
  status: RenewPassportStatus;
  adminRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
  verifiedAt?: Date;
  verifiedBy?: string;
}
