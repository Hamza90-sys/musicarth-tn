import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileAssetOwnerType } from '@prisma/client';
import { createHmac, randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_SIZE_LIMIT_BYTES = 100 * 1024 * 1024;
const ALLOWED_IMAGE_FOLDERS = new Set(['avatars', 'courses', 'misc']);

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Uploads a (client-resized) image data-URL to Supabase Storage and returns
   * a public CDN URL. If Storage isn't configured, returns the data-URL
   * unchanged so the app keeps working exactly as before (graceful fallback).
   */
  async uploadImage(dataUrl: string, folder: string): Promise<string> {
    if (typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
      throw new BadRequestException('Expected an image data URL');
    }
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const serviceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    const bucket = this.configService.get<string>('SUPABASE_STORAGE_BUCKET', 'media');
    const safeFolder = ALLOWED_IMAGE_FOLDERS.has(folder) ? folder : 'misc';

    // No Storage configured → keep the data-URL behaviour (local dev).
    if (!supabaseUrl || !serviceKey) {
      return dataUrl;
    }

    const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
    if (!match) {
      throw new BadRequestException('Malformed image data URL');
    }
    const mime = match[1];
    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > 4 * 1024 * 1024) {
      throw new BadRequestException('Image is too large (max 4MB)');
    }
    const ext = mime.split('/')[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const path = `${safeFolder}/${randomUUID()}.${ext}`;

    const base = supabaseUrl.replace(/\/$/, '');
    const endpoint = `${base}/storage/v1/object/${bucket}/${path}`;
    const publicUrl = `${base}/storage/v1/object/public/${bucket}/${path}`;

    // Retry transient failures. A long-lived server can reuse a dead keep-alive
    // socket to Supabase and throw "fetch failed"; a fresh attempt succeeds.
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            // Both headers so it works with the legacy service_role JWT *and*
            // Supabase's new `sb_secret_…` keys (the gateway needs `apikey`).
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
            'x-upsert': 'true',
            connection: 'close', // avoid reusing stale pooled sockets
          },
          // Blob body — the most portable body type for the runtime's fetch.
          body: new Blob([new Uint8Array(buffer)], { type: mime }),
        });
        if (res.ok) return publicUrl;
        const text = await res.text().catch(() => '');
        this.logger.error(`Supabase Storage upload ${res.status}: ${text}`);
        if (res.status < 500) break; // client error (auth/bucket) won't self-heal
      } catch (error) {
        this.logger.warn(
          `Supabase upload attempt ${attempt}/3 failed: ${String((error as Error)?.cause ?? error)}`,
        );
      }
      await new Promise((r) => setTimeout(r, 150 * attempt));
    }
    // Fail-safe after retries: keep working with the inline data URL.
    return dataUrl;
  }

  async createSignedUploadUrl(data: {
    ownerType: FileAssetOwnerType;
    ownerId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdById?: string | null;
  }) {
    this.assertValidFile(data.mimeType, data.sizeBytes);

    const storageKey = `${data.ownerType.toLowerCase()}/${data.ownerId}/${randomUUID()}-${this.slugify(
      data.fileName,
    )}`;
    const uploadExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    const uploadUrl = this.buildUploadUrl(storageKey, uploadExpiresAt);

    const asset = await this.prisma.fileAsset.create({
      data: {
        ownerType: data.ownerType,
        ownerId: data.ownerId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        storageKey,
        uploadUrl,
        expiresAt: uploadExpiresAt,
        createdById: data.createdById ?? null,
      },
    });

    return {
      asset,
      uploadUrl,
      expiresAt: uploadExpiresAt,
    };
  }

  async completeUpload(assetId: string, publicUrl?: string) {
    const asset = await this.prisma.fileAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset) {
      throw new NotFoundException('Upload not found');
    }

    return this.prisma.fileAsset.update({
      where: { id: assetId },
      data: {
        isUploaded: true,
        uploadedAt: new Date(),
        publicUrl: publicUrl ?? asset.publicUrl ?? this.buildPublicUrl(asset.storageKey),
      },
    });
  }

  async listAssets(ownerType: FileAssetOwnerType, ownerId: string) {
    return this.prisma.fileAsset.findMany({
      where: { ownerType, ownerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  private buildUploadUrl(storageKey: string, expiresAt: Date) {
    const baseUrl = this.configService.get<string>('STORAGE_BASE_URL', '').replace(/\/$/, '');
    const secret = this.configService.get<string>('MEDIA_SIGNING_SECRET', '');
    const timestamp = expiresAt.getTime().toString();
    const signature = createHmac('sha256', secret || 'musiqa-local-upload-secret')
      .update(`${storageKey}:${timestamp}`)
      .digest('hex');

    const root = baseUrl || 'https://storage.local';
    return `${root}/upload/${encodeURIComponent(storageKey)}?expires=${timestamp}&signature=${signature}`;
  }

  private buildPublicUrl(storageKey: string) {
    const baseUrl = this.configService.get<string>('STORAGE_BASE_URL', '').replace(/\/$/, '');
    const root = baseUrl || 'https://storage.local';
    return `${root}/files/${encodeURIComponent(storageKey)}`;
  }

  private assertValidFile(mimeType: string, sizeBytes: number) {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'audio/mpeg',
      'audio/wav',
      'video/mp4',
      'application/pdf',
      'application/zip',
    ];

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException('Unsupported file type');
    }

    if (sizeBytes <= 0 || sizeBytes > DEFAULT_SIZE_LIMIT_BYTES) {
      throw new BadRequestException('File size is out of range');
    }
  }

  private slugify(name: string) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'file';
  }
}
