import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Error as MongooseError } from 'mongoose';
import { RenewPassport } from './schemas/renew-passport.schema';
import { CreateRenewPassportDto } from './dto/create-renew-passport.dto';
import { UpdateRenewPassportDto } from './dto/update-renew-passport.dto';
import { S3Service } from '../s3/s3.service';
import { PassportDocumentType, RenewPassportStatus } from '../types/renew-passport.types';

@Injectable()
export class RenewPassportService {
  private readonly logger = new Logger(RenewPassportService.name);

  constructor(
    @InjectModel(RenewPassport.name)
    private renewPassportModel: Model<RenewPassport>,
    private s3Service: S3Service,
  ) {}

  async create(
    userId: string,
    createRenewPassportDto: CreateRenewPassportDto,
  ): Promise<RenewPassport> {
    try {
      this.logger.log('Service creating renewal with:', { userId, dto: createRenewPassportDto });

      const renewPassport = new this.renewPassportModel({
        ...createRenewPassportDto,
        userId,
        status: RenewPassportStatus.PENDING,
      });

      this.logger.debug('Model instance created:', JSON.stringify(renewPassport.toJSON()));

      const saved = await renewPassport.save();
      this.logger.log('Saved successfully:', JSON.stringify(saved.toJSON()));

      return saved;
    } catch (error) {
      this.logger.error('Detailed error in service:', {
        error: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        kind: error.kind,
        details: error.details || error,
      });

      if (error instanceof MongooseError.ValidationError) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: Object.keys(error.errors).reduce((acc, key) => {
            acc[key] = error.errors[key].message;
            return acc;
          }, {}),
        });
      }

      if (error.name === 'MongoServerError' && error.code === 11000) {
        throw new BadRequestException('Duplicate entry found');
      }

      throw new InternalServerErrorException(
        'Failed to create passport renewal request: ' + error.message,
      );
    }
  }

  async findAll(filter: { status?: RenewPassportStatus } = {}): Promise<RenewPassport[]> {
    return this.renewPassportModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findAllByUser(userId: string): Promise<RenewPassport[]> {
    return this.renewPassportModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<RenewPassport> {
    const renewPassport = await this.renewPassportModel.findById(id).exec();
    if (!renewPassport) {
      throw new NotFoundException('Passport renewal request not found');
    }
    return renewPassport;
  }

  async update(id: string, updateRenewPassportDto: UpdateRenewPassportDto): Promise<RenewPassport> {
    const renewPassport = await this.renewPassportModel
      .findByIdAndUpdate(id, updateRenewPassportDto, { new: true })
      .exec();
    if (!renewPassport) {
      throw new NotFoundException('Passport renewal request not found');
    }
    return renewPassport;
  }

  async uploadDocument(
    id: string,
    userId: string,
    file: Express.Multer.File,
    documentType: PassportDocumentType,
  ): Promise<RenewPassport> {
    const renewPassport = await this.findOne(id);

    this.logger.debug('Document ownership check:', {
      requestUserId: userId,
      documentOwnerId: renewPassport.userId,
      documentId: id,
    });

    if (renewPassport.userId !== userId) {
      throw new BadRequestException('You can only upload documents to your own requests');
    }

    if (renewPassport.status !== RenewPassportStatus.PENDING) {
      throw new BadRequestException('Cannot upload documents to non-pending requests');
    }

    const key = this.s3Service.generateFileKey(userId, documentType);
    await this.s3Service.uploadFile(file, key);

    // Update the document key in the request
    renewPassport.documents = {
      ...renewPassport.documents,
      [documentType]: key,
    };

    return renewPassport.save();
  }

  async getDocumentUrl(
    id: string,
    userId: string,
    documentType: PassportDocumentType,
  ): Promise<string> {
    const renewPassport = await this.findOne(id);

    if (renewPassport.userId !== userId) {
      throw new BadRequestException('You can only access documents from your own requests');
    }

    const documentKey = renewPassport.documents[documentType];
    if (!documentKey) {
      throw new NotFoundException(`Document of type ${documentType} not found`);
    }

    return this.s3Service.generatePresignedUrl(documentKey, 'getObject', 3600);
  }

  async deleteDocument(
    id: string,
    userId: string,
    documentType: PassportDocumentType,
  ): Promise<RenewPassport> {
    const renewPassport = await this.findOne(id);

    if (renewPassport.userId !== userId) {
      throw new BadRequestException('You can only delete documents from your own requests');
    }

    if (renewPassport.status !== RenewPassportStatus.PENDING) {
      throw new BadRequestException('Cannot delete documents from non-pending requests');
    }

    const documentKey = renewPassport.documents[documentType];
    if (!documentKey) {
      throw new NotFoundException(`Document of type ${documentType} not found`);
    }

    await this.s3Service.deleteFile(documentKey);

    const { [documentType]: removed, ...remainingDocuments } = renewPassport.documents;
    renewPassport.documents = remainingDocuments;

    return renewPassport.save();
  }
}
