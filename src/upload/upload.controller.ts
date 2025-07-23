import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Queue } from 'bullmq';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

@Controller('upload')
export class UploadController {
  constructor(
    @Inject('UPLOAD_QUEUE')
    private readonly uploadQueue: Queue,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Chỉ được upload ảnh'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const ext = extname(file.originalname);
    const filename = `${Date.now()}-${randomUUID()}${ext}`;
    const tempPath = join('/tmp', filename);

    const writeStream = createWriteStream(tempPath);
    const readStream = Readable.from(file.buffer);

    await pipeline(readStream, writeStream);

    await this.uploadQueue.add(
      'upload',
      {
        filename,
        tempPath,
        mimetype: file.mimetype,
      },
      {
        attempts: 5, // Retry up to 3 times on failure
        backoff: {
          type: 'exponential',
          delay: 2000, // Initial delay of 2 second
        },
        removeOnComplete: true,
        removeOnFail: false, // Keep failed jobs for debugging
      },
    );

    return {
      message: 'Đã nhận file, đang xử lý nền',
      file: {
        originalname: file.originalname,
        filename,
      },
    };
  }
}
