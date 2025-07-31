import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import * as express from 'express';
const UPLOAD_QUEUE = 'UPLOAD_QUEUE';
const UPLOAD_DLQ = 'UPLOAD_DLQ';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const uploadQueue = app.get(UPLOAD_QUEUE);
  const uploadDLQ = app.get(UPLOAD_DLQ);
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(uploadQueue),
      new BullMQAdapter(uploadDLQ),
    ],
    serverAdapter,
  });

  const expressApp = app.getHttpAdapter().getInstance() as express.Express;
  expressApp.use('/admin/queues', serverAdapter.getRouter());

  // app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
