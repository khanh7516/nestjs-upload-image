import { Global, Module } from '@nestjs/common';
import { BullMQProvider } from './queue.provider';

@Global()
@Module({
  providers: [BullMQProvider],
  exports: [BullMQProvider],
})
export class QueueModule {}
