import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';

export const APPLICATIONS_STORAGE_DIR = join(process.cwd(), 'storage', 'applications');

if (!existsSync(APPLICATIONS_STORAGE_DIR)) {
  mkdirSync(APPLICATIONS_STORAGE_DIR, { recursive: true });
}

// Multer config for the instructor CV upload: PDF only, max 10MB, disk-stored.
// Swap diskStorage for an R2/S3 stream when storage is provisioned (spec §13).
export const cvUploadOptions = {
  storage: diskStorage({
    destination: APPLICATIONS_STORAGE_DIR,
    filename: (_req: unknown, file: Express.Multer.File, cb: (err: Error | null, name: string) => void) => {
      cb(null, `${randomUUID()}${extname(file.originalname) || '.pdf'}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (err: Error | null, accept: boolean) => void,
  ) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new BadRequestException('CV must be a PDF file'), false);
    }
    cb(null, true);
  },
};
