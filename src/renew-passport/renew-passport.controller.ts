import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Delete,
  Logger,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { RenewPassportService } from './renew-passport.service';
import { CreateRenewPassportDto } from './dto/create-renew-passport.dto';
import { UpdateRenewPassportDto } from './dto/update-renew-passport.dto';
import { PassportDocumentType, RenewPassportStatus } from '../types/renew-passport.types';

@Controller('renew-passport')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RenewPassportController {
  private readonly logger = new Logger(RenewPassportController.name);

  constructor(private readonly renewPassportService: RenewPassportService) {}

  @Post()
  async create(@Request() req, @Body() createRenewPassportDto: CreateRenewPassportDto) {
    try {
      this.logger.debug('Full request object:', {
        user: req.user,
        headers: req.headers,
        token: req.headers.authorization,
      });

      // Check if we're getting the user from the correct place
      const userId = req?.user?.uid;

      this.logger.debug('Extracted values:', {
        userId,
        fullUserObject: req.user,
      });

      if (!userId) {
        this.logger.error('Auth debug:', {
          fullRequest: req,
          userObject: req.user,
          headers: req.headers,
        });
        throw new BadRequestException('User authentication failed');
      }

      const result = await this.renewPassportService.create(userId, createRenewPassportDto);
      return result;
    } catch (error) {
      this.logger.error('Error in renewal creation:', {
        error: error.message,
        stack: error.stack,
        user: req.user,
        dto: createRenewPassportDto,
      });
      throw error;
    }
  }

  @Get()
  @Roles('admin')
  findAll(@Query('status') status?: RenewPassportStatus) {
    return this.renewPassportService.findAll({ status });
  }

  @Get('my-requests')
  findAllByUser(@CurrentUser('uid') userId: string) {
    return this.renewPassportService.findAllByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.renewPassportService.findOne(id);
  }

  @Patch(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() updateRenewPassportDto: UpdateRenewPassportDto) {
    return this.renewPassportService.update(id, updateRenewPassportDto);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('type') documentType: PassportDocumentType,
  ) {
    this.logger.debug('Upload document request:', {
      requestId: id,
      userId,
      documentType,
    });
    return this.renewPassportService.uploadDocument(id, userId, file, documentType);
  }

  @Get(':id/documents')
  getDocumentUrl(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @Query('type') documentType: PassportDocumentType,
  ) {
    return this.renewPassportService.getDocumentUrl(id, userId, documentType);
  }

  @Delete(':id/documents')
  deleteDocument(
    @Param('id') id: string,
    @CurrentUser('uid') userId: string,
    @Query('type') documentType: PassportDocumentType,
  ) {
    return this.renewPassportService.deleteDocument(id, userId, documentType);
  }
}
