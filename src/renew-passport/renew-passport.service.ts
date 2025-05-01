import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Error as MongooseError, Types } from 'mongoose';
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
      this.logger.debug('Creating renewal request:', {
        userId,
        userIdAsObjectId: new Types.ObjectId(userId),
        dto: createRenewPassportDto,
      });

      const renewPassport = new this.renewPassportModel({
        ...createRenewPassportDto,
        userId: new Types.ObjectId(userId),
        status: RenewPassportStatus.PENDING,
      });

      this.logger.debug('Model instance before save:', renewPassport);

      const saved = await renewPassport.save();
      this.logger.debug('Saved document:', saved);

      return saved;
    } catch (error) {
      this.logger.error('Error creating renewal request:', {
        error: error.message,
        stack: error.stack,
        userId,
        dto: createRenewPassportDto,
      });
      throw error;
    }
  }

  // async findAll(filter: { status?: RenewPassportStatus } = {}): Promise<RenewPassport[]> {
  //   this.logger.debug('Finding all renewal requests with filter:', filter);

  //   const query = this.renewPassportModel
  //     .find(filter)
  //     .populate('userId', 'email firstName lastName')
  //     .sort({ createdAt: -1 });

  //   this.logger.debug('Query details:', {
  //     filter: query.getFilter(),
  //     collection: this.renewPassportModel.collection.name,
  //     database: this.renewPassportModel.collection.conn.name
  //   });

  //   const results = await query.exec();
  //   this.logger.debug(`Found ${results.length} renewal requests:`, results);

  //   return results;
  // }

  async findAll(): Promise<RenewPassport[]> {
    return this.renewPassportModel.find().exec();
  }

  async findAllByUser(userId: string): Promise<RenewPassport[]> {
    this.logger.debug('Finding requests for user:', userId);

    // First, let's see what's in the database
    const allDocs = await this.renewPassportModel.find().lean().exec();
    this.logger.debug('All documents in collection:', allDocs);

    // Now try our specific query
    const query = { userId: new Types.ObjectId(userId) };
    this.logger.debug('Query filter:', query);

    const results = await this.renewPassportModel.find(query).sort({ createdAt: -1 }).lean().exec();

    this.logger.debug('Found results:', results);

    return results;
  }

  async findOne(id: string): Promise<RenewPassport> {
    const renewPassport = await this.renewPassportModel.findById(id).populate('userId').exec();
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

    const ownerId = (renewPassport.userId as any)._id?.toString();
    this.logger.debug('Document ownership check:', {
      requestUserId: userId,
      documentOwnerId: ownerId,
      documentId: id,
    });

    if (ownerId !== userId) {
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
    const ownerId = (renewPassport.userId as any)._id?.toString();

    if (ownerId !== userId) {
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
    const ownerId = (renewPassport.userId as any)._id?.toString();

    if (ownerId !== userId) {
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
