import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationDto } from './create-application.dto';

export class UpdateApplicationDto extends PartialType(CreateApplicationDto) {
  nicPhotos?: {
    front?: string;
    back?: string;
  };

  birthCertificatePhotos?: {
    front?: string;
    back?: string;
  };

  userPhoto?: string;
}
