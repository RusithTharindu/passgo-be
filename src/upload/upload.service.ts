import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;
  private readonly allowedFileTypes: string[];

  constructor(private configService: ConfigService) {
    this.maxFileSize = this.configService.get<number>('upload.maxFileSize') ?? 5242880; // 5MB default
    this.allowedFileTypes = this.configService.get<string[]>('upload.allowedFileTypes') ?? [
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
  }

  async validateFile(file: Express.Multer.File): Promise<void> {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(`File size exceeds ${this.maxFileSize / 1024 / 1024}MB limit`);
    }

    // Check file type
    if (!this.allowedFileTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type. Allowed types: ${this.allowedFileTypes.join(', ')}`,
      );
    }
  }

  async processImage(file: Express.Multer.File): Promise<Buffer> {
    try {
      // Process image with sharp
      const processedImageBuffer = await sharp(file.buffer)
        .resize(1200, 1200, {
          // Max dimensions
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
        .toBuffer();

      return processedImageBuffer;
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`);
      throw new BadRequestException('Error processing image file');
    }
  }

  sanitizeFileName(originalName: string): string {
    // Remove special characters and spaces
    return originalName
      .toLowerCase()
      .replace(/[^a-z0-9.]/g, '-')
      .replace(/--+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
