import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export enum DocumentType {
  NIC_FRONT = 'nic-front',
  NIC_BACK = 'nic-back',
  BIRTH_CERT_FRONT = 'birth-certificate-front',
  BIRTH_CERT_BACK = 'birth-certificate-back',
  USER_PHOTO = 'user-photo',
}

@Injectable()
export class S3Service {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(S3Service.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('s3.region');
    const accessKeyId = this.configService.get<string>('s3.accessKeyId');
    const secretAccessKey = this.configService.get<string>('s3.secretAccessKey');

    if (!region || !accessKeyId || !secretAccessKey) {
      throw new Error('AWS credentials not properly configured');
    }

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const bucketName = this.configService.get<string>('s3.bucketName');
    if (!bucketName) {
      throw new Error('AWS S3 bucket name not configured');
    }
    this.bucketName = bucketName;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async uploadFile(file: Express.Multer.File, key: string, retryCount = 0): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentDisposition: 'inline',
      });

      await this.s3Client.send(command);
      return key;
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(
          `Retrying upload for key ${key}. Attempt ${retryCount + 1} of ${this.maxRetries}`,
        );
        await this.delay(this.retryDelay * Math.pow(2, retryCount)); // Exponential backoff
        return this.uploadFile(file, key, retryCount + 1);
      }
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }

  async generatePresignedUrl(
    key: string,
    operation: 'putObject' | 'getObject',
    expiresIn = 3600,
  ): Promise<string> {
    try {
      const command =
        operation === 'getObject'
          ? new GetObjectCommand({ Bucket: this.bucketName, Key: key })
          : new PutObjectCommand({ Bucket: this.bucketName, Key: key });

      return await getSignedUrl(this.s3Client, command, { expiresIn });
    } catch (error) {
      this.logger.error(`Error generating presigned URL: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(key: string, retryCount = 0): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      if (retryCount < this.maxRetries) {
        this.logger.warn(
          `Retrying delete for key ${key}. Attempt ${retryCount + 1} of ${this.maxRetries}`,
        );
        await this.delay(this.retryDelay * Math.pow(2, retryCount));
        return this.deleteFile(key, retryCount + 1);
      }
      this.logger.error(`Error deleting file from S3: ${error.message}`);
      throw error;
    }
  }

  async cleanupFailedUploads(keys: string[]): Promise<void> {
    try {
      await Promise.all(
        keys.map(key =>
          this.deleteFile(key).catch(err =>
            this.logger.error(`Failed to delete key ${key}: ${err.message}`),
          ),
        ),
      );
    } catch (error) {
      this.logger.error(`Error cleaning up failed uploads: ${error.message}`);
    }
  }

  generateFileKey(userId: string, documentType: DocumentType): string {
    const timestamp = new Date().getTime();
    return `documents/${userId}/${documentType}-${timestamp}`;
  }
}
