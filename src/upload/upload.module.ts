import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { MinioModule } from '../minio/minio.module';
import { QueueModule } from 'src/queue/queue.module';
import { UploadProcessor } from './upload.processor';
import { FileValidationService } from './file-validation.service';

@Module({
  imports: [MinioModule, QueueModule],
  controllers: [UploadController],
  providers: [UploadProcessor, FileValidationService ]
})
export class UploadModule {}