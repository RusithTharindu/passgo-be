import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Application, ApplicationStatus } from './entities/application.entity';
import { Model, Types } from 'mongoose';

type ApplicationDocument = Application & { _id: Types.ObjectId };
type ApplicationWithId = Omit<Application, '_id'> & { _id: string };

@Injectable()
export class ApplicationService {
  constructor(@InjectModel(Application.name) private applicationModel: Model<Application>) {}

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

  async remove(id: string) {
    const application = await this.applicationModel.findById(id);
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return this.applicationModel.findByIdAndDelete(id);
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
}
