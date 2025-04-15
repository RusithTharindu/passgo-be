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

@Controller('application')
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
  @Roles(Role.APPLICANT)
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
  async findAll() {
    return this.applicationService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateApplicationDto: UpdateApplicationDto) {
    return this.applicationService.update(id, updateApplicationDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.applicationService.remove(id);
  }
}
