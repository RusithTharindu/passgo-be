import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentProcessorServiceClient } from '@google-cloud/documentai';
import { GoogleAuth } from 'google-auth-library';
import { ProcessedResult, DocumentAiResponse } from './document-ai.types';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentAiService {
  private readonly logger = new Logger(DocumentAiService.name);
  private client: DocumentProcessorServiceClient;
  private processorName: string;
  private projectId: string;
  private location: string;
  private processorId: string;

  constructor(private configService: ConfigService) {
    try {
      // Get configuration
      this.projectId = this.configService.get<string>('GOOGLE_CLOUD_PROJECT_ID') || '';
      this.location = this.configService.get<string>('GOOGLE_CLOUD_LOCATION') || 'us';
      this.processorId = this.configService.get<string>('GOOGLE_CLOUD_PROCESSOR_ID') || '';

      // There are two ways to authenticate - either using a keyfile or using environment variables
      // First, try to use a keyfile if it exists
      const keyfilePath =
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        path.join(process.cwd(), 'google-credentials.json');
      let useKeyfile = false;

      if (fs.existsSync(keyfilePath)) {
        this.logger.log(`Using Google Cloud credentials from keyfile: ${keyfilePath}`);
        useKeyfile = true;
        // The client will automatically use GOOGLE_APPLICATION_CREDENTIALS env var or the default location
        this.client = new DocumentProcessorServiceClient();
      } else {
        // Fallback to manually constructed credentials
        this.logger.log('No keyfile found. Using credentials from environment variables');
        const clientEmail = this.configService.get<string>('GOOGLE_CLOUD_CLIENT_EMAIL') || '';
        const privateKey = (
          this.configService.get<string>('GOOGLE_CLOUD_PRIVATE_KEY') || ''
        ).replace(/\\n/g, '\n');

        if (!clientEmail || !privateKey) {
          throw new Error('Missing Google Cloud credentials in environment variables');
        }

        // Create credentials object
        const credentials = {
          client_email: clientEmail,
          private_key: privateKey,
        };

        // Create a JSON credentials file
        const tempCredentials = {
          type: 'service_account',
          project_id: this.projectId,
          private_key_id: 'temp-key-id',
          ...credentials,
          client_id: '',
          auth_uri: 'https://accounts.google.com/o/oauth2/auth',
          token_uri: 'https://oauth2.googleapis.com/token',
          auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`,
        };

        // Initialize client with auth directly
        this.client = new DocumentProcessorServiceClient({
          projectId: this.projectId,
          credentials: tempCredentials,
        });
      }

      // Set up processor name
      this.processorName = `projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;

      this.logger.log(`Document AI Service initialized with processor: ${this.processorName}`);
    } catch (error) {
      this.logger.error(`Failed to initialize Document AI service: ${error.message}`, error.stack);
      throw error;
    }
  }

  async processDocument(file: Express.Multer.File): Promise<DocumentAiResponse> {
    try {
      this.logger.log(`Processing document: ${file.originalname}, size: ${file.size}`);

      // Process document with Google Cloud
      const [response] = await this.client.processDocument({
        name: this.processorName,
        rawDocument: {
          content: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        },
      });

      const document = response.document;
      if (!document || !document.pages) {
        return { results: [] };
      }

      // Extract and process results
      const results = document.pages
        .flatMap(page => {
          if (!page.blocks) return [];

          return page.blocks.map(
            (block): ProcessedResult => ({
              text:
                block.layout?.textAnchor?.textSegments
                  ?.map(segment =>
                    document.text?.substring(Number(segment.startIndex), Number(segment.endIndex)),
                  )
                  .join('') || '',
              confidence: Number(block.layout?.confidence) || 0,
              boundingBox: block.layout?.boundingPoly?.normalizedVertices?.map(vertex => ({
                x: Number(vertex.x) || 0,
                y: Number(vertex.y) || 0,
              })),
            }),
          );
        })
        .filter(result => Boolean(result.text.trim()));

      this.logger.log(`Successfully processed document with ${results.length} text blocks`);
      return { results };
    } catch (error) {
      this.logger.error(`Failed to process document: ${error.message}`, error.stack);
      throw new Error(`Failed to process document: ${error.message}`);
    }
  }

  // Helper methods for diagnostics
  getProjectId(): string {
    return this.projectId;
  }

  getLocation(): string {
    return this.location;
  }

  getProcessorId(): string {
    return this.processorId;
  }
}
