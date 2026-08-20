import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]);

/** Cloudflare R2 (S3-compatible) upload service. */
@Injectable()
export class UploadsService {
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    const accountId = this.config.get<string>('r2.accountId');
    const endpoint = this.config.get<string>('r2.endpoint');
    const accessKeyId = this.config.get<string>('r2.accessKeyId');
    const secretAccessKey = this.config.get<string>('r2.secretAccessKey');
    this.bucket = this.config.get<string>('r2.bucket') ?? 'togt-uploads';
    this.publicUrl = (this.config.get<string>('r2.publicUrl') ?? '').replace(/\/$/, '');

    this.client =
      (endpoint || accountId) && accessKeyId && secretAccessKey
        ? new S3Client({
            region: 'auto',
            endpoint: endpoint || `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId, secretAccessKey },
          })
        : null;
  }

  get isConfigured() {
    return this.client !== null && this.publicUrl !== '';
  }

  async upload(file: Express.Multer.File, folder: string): Promise<string> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'File storage is not configured (missing R2 credentials)',
      );
    }
    if (!file) throw new BadRequestException('No file provided');
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File exceeds the 10MB limit');
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        'Unsupported file type. Allowed: jpg, jpeg, png, gif, webp, pdf',
      );
    }

    // Sanitize: keep only safe filename characters
    const safeName = file.originalname
      .replace(/^.*[\\/]/, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .slice(-80);
    const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '') || 'misc';
    const key = `${safeFolder}/${Date.now()}-${randomUUID()}-${safeName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${this.publicUrl}/${key}`;
  }
}
