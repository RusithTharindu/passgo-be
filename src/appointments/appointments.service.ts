import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentStatus } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { startOfDay, endOfDay, format } from 'date-fns';

@Injectable()
export class AppointmentsService {
  constructor(@InjectModel(Appointment.name) private appointmentModel: Model<Appointment>) {}

  private async isTimeSlotAvailable(
    date: Date,
    time: string,
    location: string,
    excludeId?: string,
  ): Promise<boolean> {
    const query = {
      preferredDate: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
      preferredTime: time,
      preferredLocation: location,
      status: { $in: [AppointmentStatus.APPROVED, AppointmentStatus.PENDING] },
    };

    if (excludeId) {
      Object.assign(query, { _id: { $ne: excludeId } });
    }

    const existingAppointment = await this.appointmentModel.findOne(query);
    return !existingAppointment;
  }

  private generateAppointmentId(appointment: Appointment): string {
    const dateStr = format(appointment.preferredDate, 'yyyyMMdd');
    const locationCode = appointment.preferredLocation.substring(0, 3).toUpperCase();
    const timeStr = appointment.preferredTime.replace(':', '');
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();

    return `APT-${dateStr}-${locationCode}-${timeStr}-${randomStr}`;
  }

  private formatAppointmentResponse(appointment: Appointment) {
    const response = appointment.toObject();
    return {
      ...response,
      id: appointment._id,
      appointmentId: this.generateAppointmentId(appointment),
      createdBy: {
        id: appointment.createdBy._id,
        name: appointment.createdBy.firstName + ' ' + appointment.createdBy.lastName,
        email: appointment.createdBy.email,
      },
    };
  }

  async create(createAppointmentDto: CreateAppointmentDto, userId: string) {
    const { preferredDate, preferredTime, preferredLocation } = createAppointmentDto;

    const isAvailable = await this.isTimeSlotAvailable(
      new Date(preferredDate),
      preferredTime,
      preferredLocation,
    );

    if (!isAvailable) {
      throw new BadRequestException('Selected time slot is not available');
    }

    const appointment = new this.appointmentModel({
      ...createAppointmentDto,
      createdBy: userId,
      status: AppointmentStatus.PENDING,
    });

    const savedAppointment = await appointment.save();
    await savedAppointment.populate('createdBy', 'email name');

    return this.formatAppointmentResponse(savedAppointment);
  }

  async findAll(query: any = {}) {
    const appointments = await this.appointmentModel
      .find(query)
      .populate('createdBy', 'email name')
      .sort({ createdAt: -1 })
      .exec();

    return appointments.map(appointment => this.formatAppointmentResponse(appointment));
  }

  async findOne(id: string) {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('createdBy', 'email name');

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    return this.formatAppointmentResponse(appointment);
  }

  async findByUser(userId: string) {
    const appointments = await this.findAll({ createdBy: userId });
    return appointments.map(appointment => this.formatAppointmentResponse(appointment));
  }

  async update(id: string, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Check time slot availability if date/time/location is being updated
    if (
      updateAppointmentDto.preferredDate ||
      updateAppointmentDto.preferredTime ||
      updateAppointmentDto.preferredLocation
    ) {
      const isAvailable = await this.isTimeSlotAvailable(
        new Date(updateAppointmentDto.preferredDate || appointment.preferredDate),
        updateAppointmentDto.preferredTime || appointment.preferredTime,
        updateAppointmentDto.preferredLocation || appointment.preferredLocation,
        id,
      );

      if (!isAvailable) {
        throw new BadRequestException('Selected time slot is not available');
      }
    }

    const updated = await this.appointmentModel
      .findByIdAndUpdate(id, updateAppointmentDto, { new: true })
      .populate('createdBy', 'email name');

    if (!updated) {
      throw new NotFoundException('Appointment not found after update');
    }

    return this.formatAppointmentResponse(updated);
  }

  async remove(id: string) {
    const appointment = await this.appointmentModel.findById(id);

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.APPROVED) {
      throw new BadRequestException('Cannot delete an approved appointment');
    }

    await this.appointmentModel.findByIdAndDelete(id);
    return { message: 'Appointment deleted successfully' };
  }

  async getAvailableTimeSlots(date: Date, location: string) {
    const timeSlots = [
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
      '13:00',
      '13:30',
      '14:00',
      '14:30',
      '15:00',
      '15:30',
    ];

    const bookedAppointments = await this.appointmentModel.find({
      preferredDate: {
        $gte: startOfDay(date),
        $lte: endOfDay(date),
      },
      preferredLocation: location,
      status: { $in: [AppointmentStatus.APPROVED, AppointmentStatus.PENDING] },
    });

    const bookedTimes = new Set(bookedAppointments.map(app => app.preferredTime));

    return timeSlots.filter(time => !bookedTimes.has(time));
  }
}
