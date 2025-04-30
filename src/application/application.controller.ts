import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Logger,
  UnauthorizedException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ThrottlerGuard, Throttle } from '@nestjs/throttler';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Role } from '../enums/user.enum';
import { Roles } from '../auth/decorators/roles.decorators';
import { ApplicationStatus } from './entities/application.entity';
import { S3Service, DocumentType } from '../s3/s3.service';
import { UploadService } from '../upload/upload.service';

@Controller('application')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
export class ApplicationController {
  private readonly logger = new Logger(ApplicationController.name);
  private uploadedKeys: string[] = [];

  constructor(
    private readonly applicationService: ApplicationService,
    private readonly s3Service: S3Service,
    private readonly uploadService: UploadService,
  ) {}

  @Get('test-auth')
  @UseGuards(JwtAuthGuard)
  testAuth(@Request() req) {
    this.logger.debug('User object:', req.user);
    return {
      message: 'Auth working',
      user: req.user,
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.APPLICANT, Role.ADMIN)
  async create(@Request() req, @Body() createApplicationDto: CreateApplicationDto) {
    this.logger.debug('Full user object:', req.user);

    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = req.user._id || req.user.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }

    return this.applicationService.create(createApplicationDto, userId);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll() {
    return this.applicationService.findAll();
  }

  @Get('my-applications')
  @Roles(Role.APPLICANT)
  async findMyApplications(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = req.user._id || req.user.id;
    if (!userId) {
      throw new UnauthorizedException('User ID not found');
    }

    return this.applicationService.findByUser(userId);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.APPLICANT)
  async findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  async update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationService.update(id, updateApplicationDto);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.MANAGER)
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ApplicationStatus; comment?: string },
  ) {
    return this.applicationService.updateStatus(id, body.status, body.comment);
  }

  @Patch(':id/verify-document')
  @Roles(Role.ADMIN, Role.MANAGER)
  async verifyDocument(@Param('id') id: string, @Body() body: { documentType: string }) {
    return this.applicationService.verifyDocument(id, body.documentType);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async remove(@Param('id') id: string) {
    return this.applicationService.remove(id);
  }

  @Post('upload-document/:type')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('type') type: string,
    @Request() req,
  ) {
    const userId = req.user._id || req.user.id;
    let documentType: DocumentType;

    switch (type) {
      case 'nic-front':
        documentType = DocumentType.NIC_FRONT;
        break;
      case 'nic-back':
        documentType = DocumentType.NIC_BACK;
        break;
      case 'birth-cert-front':
        documentType = DocumentType.BIRTH_CERT_FRONT;
        break;
      case 'birth-cert-back':
        documentType = DocumentType.BIRTH_CERT_BACK;
        break;
      case 'user-photo':
        documentType = DocumentType.USER_PHOTO;
        break;
      default:
        throw new Error('Invalid document type');
    }

    try {
      // Validate file
      await this.uploadService.validateFile(file);

      // Process image
      const processedFile = {
        ...file,
        buffer: await this.uploadService.processImage(file),
      };

      // Generate sanitized key
      const sanitizedName = this.uploadService.sanitizeFileName(file.originalname);
      const fileKey = this.s3Service.generateFileKey(userId, documentType);

      // Upload to S3
      const uploadedKey = await this.s3Service.uploadFile(processedFile, fileKey);
      this.uploadedKeys.push(uploadedKey);

      const downloadUrl = await this.s3Service.generatePresignedUrl(
        uploadedKey,
        'getObject',
        3600 * 24 * 7, // 7 days
      );

      // Update application with the new URL
      const applicationId = req.query.applicationId;
      if (!applicationId) {
        // Cleanup uploaded file if no application ID
        await this.s3Service.deleteFile(uploadedKey);
        throw new Error('Application ID is required');
      }

      const updateData: Partial<UpdateApplicationDto> = {};

      switch (documentType) {
        case DocumentType.NIC_FRONT:
          updateData.nicPhotos = { front: downloadUrl };
          break;
        case DocumentType.NIC_BACK:
          updateData.nicPhotos = { back: downloadUrl };
          break;
        case DocumentType.BIRTH_CERT_FRONT:
          updateData.birthCertificatePhotos = { front: downloadUrl };
          break;
        case DocumentType.BIRTH_CERT_BACK:
          updateData.birthCertificatePhotos = { back: downloadUrl };
          break;
        case DocumentType.USER_PHOTO:
          updateData.userPhoto = downloadUrl;
          break;
      }

      await this.applicationService.updateDocumentUrls(applicationId, updateData);

      return {
        key: uploadedKey,
        url: downloadUrl,
      };
    } catch (error) {
      // Cleanup any uploaded files in case of error
      if (this.uploadedKeys.length > 0) {
        await this.s3Service.cleanupFailedUploads(this.uploadedKeys);
        this.uploadedKeys = [];
      }

      this.logger.error(`Error uploading document: ${error.message}`);
      throw error;
    }
  }

  @Get('documents/:applicationId')
  async getDocumentUrls(@Param('applicationId') applicationId: string) {
    try {
      const application = await this.applicationService.findOne(applicationId);
      return {
        nicPhotos: application.nicPhotos,
        birthCertificatePhotos: application.birthCertificatePhotos,
        userPhoto: application.userPhoto,
      };
    } catch (error) {
      this.logger.error(`Error fetching document URLs: ${error.message}`);
      throw error;
    }
  }
}
