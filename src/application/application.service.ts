import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Application, ApplicationStatus } from './entities/application.entity';
import { Model, Types } from 'mongoose';
import { S3Service } from '../s3/s3.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Logger } from '@nestjs/common';

type ApplicationDocument = Application & { _id: Types.ObjectId };
type ApplicationWithId = Omit<Application, '_id'> & { _id: string };

@Injectable()
export class ApplicationService {
  private readonly logger = new Logger(ApplicationService.name);
  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
    private readonly s3Service: S3Service,
  ) {}

  async create(createApplicationDto: CreateApplicationDto, userId: string) {
    const application = new this.applicationModel({
      ...createApplicationDto,
      submittedBy: new Types.ObjectId(userId),
      status: ApplicationStatus.SUBMITTED,
      statusHistory: [
        {
          status: ApplicationStatus.SUBMITTED,
          timestamp: new Date(),
          comment: 'Application submitted',
        },
      ],
    });

    const savedApplication = await application.save();
    const result = savedApplication.toObject() as ApplicationDocument;
    const { _id, submittedBy, ...rest } = result;

    return {
      _id: _id.toString(),
      ...rest,
      submittedBy: userId,
    };
  }

  async findAll() {
    const applications = await this.applicationModel.find().populate('submittedBy');
    return applications.map(app => {
      const result = app.toObject() as ApplicationDocument;
      const { _id, submittedBy, ...rest } = result;
      return {
        _id: _id.toString(),
        ...rest,
        submittedBy: (submittedBy as any)._id.toString(),
      };
    });
  }

  async findByUser(userId: string) {
    const applications = await this.applicationModel
      .find({ submittedBy: new Types.ObjectId(userId) })
      .populate('submittedBy');

    return applications.map(app => {
      const result = app.toObject() as ApplicationDocument;
      const { _id, submittedBy, ...rest } = result;
      return {
        _id: _id.toString(),
        ...rest,
        submittedBy: (submittedBy as any)._id.toString(),
      };
    });
  }

  async findOne(id: string) {
    const application = await this.applicationModel.findById(id).populate('submittedBy');
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const result = application.toObject() as ApplicationDocument;
    const { _id, submittedBy, ...rest } = result;
    return {
      _id: _id.toString(),
      ...rest,
      submittedBy: (submittedBy as any)._id.toString(),
    };
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    const application = await this.applicationModel.findById(id);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const updated = await this.applicationModel
      .findByIdAndUpdate(id, updateApplicationDto, { new: true })
      .populate('submittedBy');

    if (!updated) {
      throw new NotFoundException('Application not found after update');
    }

    const result = updated.toObject() as ApplicationDocument;
    const { _id, submittedBy, ...rest } = result;
    return {
      _id: _id.toString(),
      ...rest,
      submittedBy: (submittedBy as any)._id.toString(),
    };
  }

  async updateStatus(id: string, status: ApplicationStatus, comment?: string) {
    const application = await this.applicationModel.findById(id);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (!this.isValidStatusTransition(application.status, status)) {
      throw new BadRequestException('Invalid status transition');
    }

    application.status = status;
    application.statusHistory.push({
      status,
      timestamp: new Date(),
      comment,
    });

    const updated = await application.save();
    const result = updated.toObject() as ApplicationDocument;
    const { _id, submittedBy, ...rest } = result;
    return {
      _id: _id.toString(),
      ...rest,
      submittedBy: (submittedBy as any)._id.toString(),
    };
  }

  async verifyDocument(id: string, documentType: string) {
    const application = await this.applicationModel.findById(id);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const docVerification = application.documentVerification.find(
      doc => doc.documentType === documentType,
    );

    if (!docVerification) {
      throw new BadRequestException('Document type not found');
    }

    docVerification.verified = true;
    docVerification.verificationDate = new Date();

    const updated = await application.save();
    const result = updated.toObject() as ApplicationDocument;
    const { _id, submittedBy, ...rest } = result;
    return {
      _id: _id.toString(),
      ...rest,
      submittedBy: (submittedBy as any)._id.toString(),
    };
  }

  async remove(id: string): Promise<Application> {
    const deletedApplication = await this.applicationModel.findByIdAndDelete(id).exec();
    if (!deletedApplication) {
      throw new NotFoundException(`Application with ID "${id}" not found`);
    }
    return deletedApplication;
  }

  async updateDocumentUrls(
    id: string,
    updateData: Partial<UpdateApplicationDto>,
  ): Promise<Application> {
    const application = await this.applicationModel.findById(id);
    if (!application) {
      throw new NotFoundException(`Application #${id} not found`);
    }

    // Merge existing and new photo URLs
    if (updateData.nicPhotos) {
      application.nicPhotos = {
        ...application.nicPhotos,
        ...updateData.nicPhotos,
      };
    }

    if (updateData.birthCertificatePhotos) {
      application.birthCertificatePhotos = {
        ...application.birthCertificatePhotos,
        ...updateData.birthCertificatePhotos,
      };
    }

    if (updateData.userPhoto) {
      application.userPhoto = updateData.userPhoto;
    }

    return application.save();
  }

  private isValidStatusTransition(
    currentStatus: ApplicationStatus,
    newStatus: ApplicationStatus,
  ): boolean {
    const validTransitions = {
      [ApplicationStatus.SUBMITTED]: [
        ApplicationStatus.PAYMENT_PENDING,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.PAYMENT_PENDING]: [
        ApplicationStatus.PAYMENT_VERIFIED,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.PAYMENT_VERIFIED]: [
        ApplicationStatus.COUNTER_VERIFICATION,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.COUNTER_VERIFICATION]: [
        ApplicationStatus.BIOMETRICS_PENDING,
        ApplicationStatus.ON_HOLD,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.BIOMETRICS_PENDING]: [
        ApplicationStatus.BIOMETRICS_COMPLETED,
        ApplicationStatus.ON_HOLD,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.BIOMETRICS_COMPLETED]: [
        ApplicationStatus.CONTROLLER_REVIEW,
        ApplicationStatus.ON_HOLD,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.CONTROLLER_REVIEW]: [
        ApplicationStatus.SENIOR_OFFICER_REVIEW,
        ApplicationStatus.ON_HOLD,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.SENIOR_OFFICER_REVIEW]: [
        ApplicationStatus.DATA_ENTRY,
        ApplicationStatus.ON_HOLD,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.DATA_ENTRY]: [
        ApplicationStatus.PRINTING_PENDING,
        ApplicationStatus.ON_HOLD,
        ApplicationStatus.REJECTED,
      ],
      [ApplicationStatus.PRINTING_PENDING]: [ApplicationStatus.PRINTING, ApplicationStatus.ON_HOLD],
      [ApplicationStatus.PRINTING]: [ApplicationStatus.QUALITY_ASSURANCE],
      [ApplicationStatus.QUALITY_ASSURANCE]: [
        ApplicationStatus.READY_FOR_COLLECTION,
        ApplicationStatus.PRINTING,
      ],
      [ApplicationStatus.READY_FOR_COLLECTION]: [ApplicationStatus.COLLECTED],
      [ApplicationStatus.ON_HOLD]: [
        ApplicationStatus.COUNTER_VERIFICATION,
        ApplicationStatus.BIOMETRICS_PENDING,
        ApplicationStatus.CONTROLLER_REVIEW,
        ApplicationStatus.SENIOR_OFFICER_REVIEW,
        ApplicationStatus.DATA_ENTRY,
        ApplicationStatus.PRINTING_PENDING,
        ApplicationStatus.REJECTED,
      ],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  async getTotalApplicationsCount(): Promise<number> {
    return this.applicationModel.countDocuments().exec();
  }

  async getAppointmentRequestsCount(): Promise<number> {
    return this.applicationModel
      .countDocuments({ appointmentDate: { $exists: true, $ne: null } })
      .exec();
  }

  async getRenewalRequestsCount(): Promise<number> {
    return this.applicationModel
      .countDocuments({ presentTravelDocument: { $exists: true, $ne: '' } })
      .exec();
  }

  async getDailyApplicationDistribution(): Promise<{ date: string; applications: number }[]> {
    const result = await this.applicationModel
      .aggregate([
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            applications: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            applications: 1,
          },
        },
        {
          $sort: { date: 1 },
        },
      ])
      .exec();

    // The aggregation now returns data for all dates present in the database.
    // No need to fill in missing dates as the user wants all historical data.
    return result;
  }

  async getPassportTypesDistribution(): Promise<{ name: string; value: number }[]> {
    const result = await this.applicationModel
      .aggregate([
        {
          $group: {
            _id: '$TypeofTravelDocument',
            value: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            name: {
              $switch: {
                branches: [
                  { case: { $eq: ['$_id', 'all'] }, then: 'All Countries' },
                  { case: { $eq: ['$_id', 'middleEast'] }, then: 'Middle East' },
                  {
                    case: { $eq: ['$_id', 'emergencyCertificate'] },
                    then: 'Emergency Certificate',
                  },
                  { case: { $eq: ['$_id', 'identityCertificate'] }, then: 'Identity Certificate' },
                ],
                default: '$_id',
              },
            },
            value: 1,
          },
        },
        {
          $sort: { value: -1 },
        },
      ])
      .exec();

    return result;
  }

  async getDistrictApplicationsDistribution(): Promise<{ name: string; value: number }[]> {
    const result = await this.applicationModel
      .aggregate([
        {
          $group: {
            _id: '$permenantAddressDistrict',
            value: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            name: '$_id',
            value: 1,
          },
        },
        {
          $sort: { value: -1 },
        },
      ])
      .exec();

    return result;
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredPresignedUrls() {
    // ... existing code ...
  }
}
