import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentAiService } from './document-ai.service';
import { DocumentResultDto } from './dto/document-result.dto';
import { Request } from 'express';

@Controller('document-ai')
export class DocumentAiController {
  private readonly logger = new Logger(DocumentAiController.name);

  constructor(private readonly documentAiService: DocumentAiService) {}

  @Post('process')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/(jpg|jpeg|png|pdf)/)) {
          return callback(
            new BadRequestException('Only JPG, PNG and PDF files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async processDocument(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<DocumentResultDto> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      this.logger.log(
        `Processing file: ${file.originalname}, size: ${file.size}, mimetype: ${file.mimetype}`,
      );

      // Log request details to help diagnose issues
      this.logger.debug(`Request headers: ${JSON.stringify(req.headers)}`);

      return await this.documentAiService.processDocument(file);
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`, error.stack);

      // Log detailed error information
      if (error.response) {
        this.logger.error(`Error response: ${JSON.stringify(error.response)}`);
      }

      throw new InternalServerErrorException(`Failed to process document: ${error.message}`);
    }
  }

  // Add a test endpoint to verify that the controller is working
  @Post('test')
  async testEndpoint() {
    try {
      // Check environment variables
      const projectId = this.documentAiService.getProjectId();
      const location = this.documentAiService.getLocation();
      const processorId = this.documentAiService.getProcessorId();

      return {
        status: 'Document AI controller is working',
        config: {
          projectId: projectId ? 'Set' : 'Not set',
          location: location ? 'Set' : 'Not set',
          processorId: processorId ? 'Set' : 'Not set',
        },
      };
    } catch (error) {
      this.logger.error(`Test endpoint error: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Test failed: ${error.message}`);
    }
  }
}
