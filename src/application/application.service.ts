import { Injectable } from '@nestjs/common';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Application } from './entities/application.entity';
import { Model } from 'mongoose';

@Injectable()
export class ApplicationService {
  constructor(@InjectModel(Application.name) private applicationModel: Model<Application>) {}

  async create(createApplicationDto: CreateApplicationDto, userId: string) {
    const application = new this.applicationModel({
      ...createApplicationDto,
      submittedBy: userId,
    });
    return application.save();
  }

  async findAll() {
    return this.applicationModel.find().populate('submittedBy');
  }

  async findOne(id: string) {
    return this.applicationModel.findById(id).populate('submittedBy');
  }

  async update(id: string, updateApplicationDto: UpdateApplicationDto) {
    return this.applicationModel
      .findByIdAndUpdate(id, updateApplicationDto, { new: true })
      .populate('submittedBy');
  }

  async remove(id: string) {
    return this.applicationModel.findByIdAndDelete(id);
  }
}
