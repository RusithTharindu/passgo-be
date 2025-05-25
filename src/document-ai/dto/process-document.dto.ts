import { IsNotEmpty } from 'class-validator';

export class ProcessDocumentDto {
  @IsNotEmpty()
  file: Express.Multer.File;
}
