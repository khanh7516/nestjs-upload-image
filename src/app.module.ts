import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { MinioModule } from './minio/minio.module';
import { UploadRateLimitMiddleware } from './middleware/upload-rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env.NODE_ENV === 'docker' ? '.env.docker' : '.env.local',
      isGlobal: true,
    }),
    UploadModule,
    MinioModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer;
    // .apply(UploadRateLimitMiddleware)
    // .forRoutes({ path: 'upload', method: RequestMethod.POST });
  }
}
