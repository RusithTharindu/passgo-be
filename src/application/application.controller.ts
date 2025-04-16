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
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { Role } from '../enums/user.enum';
import { Roles } from '../auth/decorators/roles.decorators';
import { ApplicationStatus } from './entities/application.entity';

@Controller('application')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplicationController {
  private readonly logger = new Logger(ApplicationController.name);

  constructor(private readonly applicationService: ApplicationService) {}

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
}
