import { Injectable } from '@nestjs/common';
import { Client } from 'minio';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'stream';

@Injectable()
export class MinioService {
  private client: Client;

  constructor(private configService: ConfigService) {
    this.client = new Client({
      endPoint: this.configService.getOrThrow<string>('MINIO_ENDPOINT'),
      port: parseInt(this.configService.getOrThrow<string>('MINIO_PORT'), 10),
      useSSL: false,
      accessKey: this.configService.getOrThrow<string>('MINIO_ACCESS_KEY'),
      secretKey: this.configService.getOrThrow<string>('MINIO_SECRET_KEY'),
    });
  }

  async uploadStream(bucket: string, objectName: string, stream: Readable, contentType: string) {
    await this.client.putObject(bucket, objectName, stream, undefined, {
      'Content-Type': contentType,
    });
  }
}