import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { MinioService } from 'src/minio/minio.service';
import * as fs from 'fs/promises';

@Controller('upload')
export class UploadController {
  constructor(private readonly minioService: MinioService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          const ext = extname(file.originalname);
          const name = `${Date.now()}${ext}`;
          cb(null, name);
        },
      }),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File is required');

    const objectName = file.filename;
    const bucket = 'demo-bucket';

    console.time(`Upload time - ${file.originalname}`);

    // console.time(`Upload MinIO - ${file.originalname}`);
    await this.minioService.uploadFile(bucket, objectName, file.path);
    // console.timeEnd(`Upload MinIO - ${file.originalname}`);

    // console.time(`Xóa file local - ${file.originalname}`);
    await fs.unlink(file.path);
    // console.timeEnd(`Xóa file local - ${file.originalname}`);

    console.timeEnd(`Upload time - ${file.originalname}`);

    return {
      message: 'Upload thành công',
      file: {
        originalname: file.originalname,
        filename: file.filename,
      },
    };
  }
}