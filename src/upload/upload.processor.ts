import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { Worker, Queue } from 'bullmq';
import { createReadStream, unlink, existsSync } from 'fs';
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
      async (job) => {
        const { filename, tempPath, mimetype } = job.data;

        console.log(
          `🌀 Đang xử lý job ${job.id}, lần thử thứ ${job.attemptsMade + 1}`,
        );

        try {
          // const shouldFail = Math.random() < 0.2;
          // if (shouldFail) {
          //   throw new Error(`🔁 Giả lập lỗi tạm thời cho job ${job.id}`);
          // }

          if (!existsSync(tempPath)) {
            throw new Error(`File không tồn tại: ${tempPath}`);
          }

          const stream = createReadStream(tempPath);
          await this.minioService.uploadStream(
            'demo-bucket',
            filename,
            stream,
            mimetype,
          );

          console.log(`✅ Uploaded: ${filename}`);

          unlink(tempPath, (err) => {
            if (err) {
              console.error(`❌ Không thể xóa file tạm: ${tempPath}`, err);
            } else {
              console.log(`🧹 Đã xóa file tạm: ${tempPath}`);
            }
          });
        } catch (err) {
          console.error(`❌ Lỗi khi xử lý job ${job.id}:`, err);
          throw err;
        }
      },
      {
        connection: this.uploadQueue.opts.connection,
        concurrency: 2,
      },
    );

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed:`, err);
    });

    worker.on('completed', async (job) => {
      console.log(`✅ Completed job ${job.id}`);

      const [waiting, active, delayed] = await Promise.all([
        this.uploadQueue.getWaitingCount(),
        this.uploadQueue.getActiveCount(),
        this.uploadQueue.getDelayedCount(),
      ]);

      console.log(
        `📊 Queue Stats → waiting: ${waiting}, active: ${active}, delayed: ${delayed}`,
      );

      if (waiting === 0 && active === 0 && delayed === 0) {
        console.log(
          '🎯 Queue is fully empty — All jobs including retries have been processed.',
        );
      }
    });
  }
}
