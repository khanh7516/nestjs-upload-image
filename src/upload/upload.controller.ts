import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from 'src/minio/minio.service';
import { extname } from 'path';
import { Readable } from 'stream';

@Controller('upload')
export class UploadController {
  constructor(private readonly minioService: MinioService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
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
    const objectName = `${Date.now()}${ext}`;
    const bucket = 'demo-bucket';

    const stream = Readable.from(file.buffer);

    await this.minioService.uploadStream(bucket, objectName, stream, file.mimetype);

    return {
      message: 'Upload thành công',
      file: {
        originalname: file.originalname,
        filename: objectName,
      },
    };
  }
}