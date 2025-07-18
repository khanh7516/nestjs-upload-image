import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Worker, Queue } from 'bullmq';
import { createReadStream, unlink } from 'fs';
import { MinioService } from 'src/minio/minio.service';

@Injectable()
export class UploadProcessor implements OnModuleInit {
  constructor(
    private readonly minioService: MinioService,
    @Inject('UPLOAD_QUEUE')
    private readonly uploadQueue: Queue,
  ) {}

  onModuleInit() {
    const worker = new Worker(
      this.uploadQueue.name,
      async job => {
        const { filename, tempPath, mimetype } = job.data;

        const stream = createReadStream(tempPath);
        await this.minioService.uploadStream('demo-bucket', filename, stream, mimetype);

        unlink(tempPath, err => {
          if (err) console.error(`❌ Không thể xóa file tạm:`, err);
          else console.log(`🧹 Đã xóa file tạm: ${tempPath}`);
        });

        console.log(`✅ Uploaded: ${filename}`);
      },
      {
        connection: this.uploadQueue.opts.connection,
        concurrency: 5,
      }
    );

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err);
    });

    worker.on('completed', async job => {
      console.log(`✅ Completed job ${job.id}`);

      const waiting = await this.uploadQueue.getWaitingCount();
      const active = await this.uploadQueue.getActiveCount();

      if (waiting === 0 && active === 0) {
        console.log('🎯 Queue is empty — All jobs have been processed.');
      }
    });
  }
}