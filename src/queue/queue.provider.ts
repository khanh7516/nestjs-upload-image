import { Queue } from 'bullmq';
import { RedisOptions } from 'ioredis';

const connection: RedisOptions = {
  host: process.env.REDIS_HOST,
  port: 6379,
};

export const UploadQueue = new Queue('upload-image', { connection });

export const BullMQProvider = {
  provide: 'UPLOAD_QUEUE',
  useValue: UploadQueue,
};