import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { FileAssetOwnerType } from '@prisma/client';
import { UploadsService } from './uploads.service';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('signed-url')
  async createSignedUploadUrl(
    @CurrentUser() user: { sub: string },
    @Body('ownerType') ownerType: FileAssetOwnerType,
    @Body('ownerId') ownerId: string,
    @Body('fileName') fileName: string,
    @Body('mimeType') mimeType: string,
    @Body('sizeBytes') sizeBytes: number,
  ) {
    return this.uploadsService.createSignedUploadUrl({
      ownerType,
      ownerId,
      fileName,
      mimeType,
      sizeBytes: Number(sizeBytes),
      createdById: user.sub,
    });
  }

  // Upload a client-resized image (data URL) to object storage; returns a CDN URL.
  @Post('image')
  async uploadImage(
    @Body('dataUrl') dataUrl: string,
    @Body('folder') folder: string,
  ) {
    return { url: await this.uploadsService.uploadImage(dataUrl, folder) };
  }

  @Patch(':assetId/complete')
  async completeUpload(
    @Param('assetId') assetId: string,
    @Body('publicUrl') publicUrl?: string,
  ) {
    return this.uploadsService.completeUpload(assetId, publicUrl);
  }

  @Get()
  async listAssets(
    @Query('ownerType') ownerType: FileAssetOwnerType,
    @Query('ownerId') ownerId: string,
  ) {
    return this.uploadsService.listAssets(ownerType, ownerId);
  }
}
