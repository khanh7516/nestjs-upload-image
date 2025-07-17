import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';

@Injectable()
export class MinioService implements OnModuleInit {
  private client: Client;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.client = new Client({
      endPoint: this.configService.get<string>('MINIO_ENDPOINT') ?? 'localhost',
      port: parseInt(this.configService.get<string>('MINIO_PORT') ?? '9000'),
      useSSL: this.configService.get<string>('MINIO_USE_SSL') === 'true',
      accessKey: this.configService.get<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get<string>('MINIO_SECRET_KEY'),
    });
  }

  async uploadFile(bucket: string, objectName: string, filePath: string) {
    return this.client.fPutObject(bucket, objectName, filePath);
  }

  getClient() {
    return this.client;
  }
}