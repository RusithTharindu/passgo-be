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
import { PassportDocumentType } from '../types/renew-passport.types';
import { InjectModel } from '@nestjs/mongoose';
import { Application } from './entities/application.entity';
import { Model } from 'mongoose';

@Controller('application')
@UseGuards(JwtAuthGuard, RolesGuard, ThrottlerGuard)
export class ApplicationController {
  private readonly logger = new Logger(ApplicationController.name);
  private uploadedKeys: string[] = [];

  constructor(
    private readonly applicationService: ApplicationService,
    private readonly s3Service: S3Service,
    private readonly uploadService: UploadService,
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
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

    if (!req.user.uid) {
      throw new UnauthorizedException('User ID not found');
    }

    return this.applicationService.create(createApplicationDto, req.user.uid);
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

    if (!req.user.uid) {
      throw new UnauthorizedException('User ID not found');
    }

    return this.applicationService.findByUser(req.user.uid);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.APPLICANT)
  async findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.APPLICANT)
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
    if (!req.user.uid) {
      throw new UnauthorizedException('User ID not found');
    }

    // Validate document type
    if (!Object.values(PassportDocumentType).includes(type as PassportDocumentType)) {
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
      const fileKey = this.s3Service.generateFileKey(req.user.uid, type as unknown as DocumentType);

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

      // Get existing application
      const application = await this.applicationService.findOne(applicationId);

      // Update documents field
      await this.applicationModel.findByIdAndUpdate(
        applicationId,
        {
          $set: {
            [`documents.${type}`]: downloadUrl,
          },
        },
        { new: true },
      );

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
        documents: application.documents || {},
      };
    } catch (error) {
      this.logger.error(`Error fetching document URLs: ${error.message}`);
      throw error;
    }
  }

  @Get('stats/total-applications')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getTotalApplicationsCount() {
    return this.applicationService.getTotalApplicationsCount();
  }

  @Get('stats/appointment-requests')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getAppointmentRequestsCount() {
    return this.applicationService.getAppointmentRequestsCount();
  }

  @Get('stats/renewal-requests')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getRenewalRequestsCount() {
    return this.applicationService.getRenewalRequestsCount();
  }

  @Get('stats/daily-distribution')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getDailyApplicationDistribution() {
    return this.applicationService.getDailyApplicationDistribution();
  }

  @Get('stats/passport-types')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getPassportTypesDistribution() {
    return this.applicationService.getPassportTypesDistribution();
  }

  @Get('stats/district-distribution')
  @Roles(Role.ADMIN, Role.MANAGER)
  async getDistrictApplicationsDistribution() {
    return this.applicationService.getDistrictApplicationsDistribution();
  }
}
