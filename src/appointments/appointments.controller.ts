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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { Role } from '../enums/user.enum';
import { AppointmentStatus } from './entities/appointment.entity';
import { startOfDay, endOfDay } from 'date-fns';

@Controller('appointments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(Role.APPLICANT)
  async create(@Request() req, @Body() createAppointmentDto: CreateAppointmentDto) {
    if (!req.user?._id) {
      throw new BadRequestException('User not found');
    }
    return this.appointmentsService.create(createAppointmentDto, req.user._id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  async findAll(
    @Query('status') status?: AppointmentStatus,
    @Query('location') location?: string,
    @Query('date') date?: string,
  ) {
    const query: any = {};

    if (status) query.status = status;
    if (location) query.preferredLocation = location;
    if (date) {
      const searchDate = new Date(date);
      query.preferredDate = {
        $gte: startOfDay(searchDate),
        $lte: endOfDay(searchDate),
      };
    }

    return this.appointmentsService.findAll(query);
  }

  @Get('my-appointments')
  @Roles(Role.APPLICANT)
  async findMyAppointments(@Request() req, @Query('status') status?: AppointmentStatus) {
    if (!req.user?._id) {
      throw new BadRequestException('User not found');
    }
    const query: any = { createdBy: req.user._id };
    if (status) query.status = status;

    return this.appointmentsService.findAll(query);
  }

  @Get('available-slots')
  async getAvailableSlots(@Query('date') date: string, @Query('location') location: string) {
    if (!date || !location) {
      throw new BadRequestException('Date and location are required');
    }
    return this.appointmentsService.getAvailableTimeSlots(new Date(date), location);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.APPLICANT)
  async findOne(@Param('id') id: string, @Request() req) {
    const appointment = await this.appointmentsService.findOne(id);

    // Allow applicants to only view their own appointments
    if (req.user.role === Role.APPLICANT && appointment.createdBy.id.toString() !== req.user._id) {
      throw new BadRequestException('Not authorized to view this appointment');
    }

    return appointment;
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.APPLICANT)
  async update(
    @Param('id') id: string,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
    @Request() req,
  ) {
    const appointment = await this.appointmentsService.findOne(id);

    // Handle applicant updates
    if (req.user.role === Role.APPLICANT) {
      if (appointment.createdBy.id.toString() !== req.user._id) {
        throw new BadRequestException('Not authorized to update this appointment');
      }

      // Applicants can only update certain fields if appointment is pending
      if (appointment.status !== AppointmentStatus.PENDING) {
        throw new BadRequestException('Can only update pending appointments');
      }

      // Filter allowed fields for applicants
      const allowedFields = [
        'preferredDate',
        'preferredTime',
        'preferredLocation',
        'contactNumber',
        'reason',
      ];

      const filteredUpdate = Object.keys(updateAppointmentDto)
        .filter(key => allowedFields.includes(key))
        .reduce((obj, key) => {
          obj[key] = updateAppointmentDto[key];
          return obj;
        }, {});

      return this.appointmentsService.update(id, filteredUpdate);
    }

    // Handle admin/manager updates
    return this.appointmentsService.update(id, updateAppointmentDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.APPLICANT)
  async remove(@Param('id') id: string, @Request() req) {
    const appointment = await this.appointmentsService.findOne(id);

    // Applicants can only delete their own pending appointments
    if (req.user.role === Role.APPLICANT) {
      if (appointment.createdBy.id.toString() !== req.user._id) {
        throw new BadRequestException('Not authorized to delete this appointment');
      }
      if (appointment.status !== AppointmentStatus.PENDING) {
        throw new BadRequestException('Can only delete pending appointments');
      }
    }

    return this.appointmentsService.remove(id);
  }
}
