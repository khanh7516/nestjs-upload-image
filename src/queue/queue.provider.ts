import { Queue } from 'bullmq';
import { RedisOptions } from 'ioredis';

const connection: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
};

export const UploadQueue = new Queue('upload-image', { connection });

export const BullMQProvider = {
  provide: 'UPLOAD_QUEUE',
  useValue: UploadQueue,
};

// Queue DLQ (Dead Letter Queue)
export const UploadDLQ = new Queue('upload-image-dlq', { connection });

export const BullMQDLQProvider = {
  provide: 'UPLOAD_DLQ',
  useValue: UploadDLQ,
};