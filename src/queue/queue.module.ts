import { Global, Module } from '@nestjs/common';
import { BullMQProvider, BullMQDLQProvider  } from './queue.provider';

@Global()
@Module({
  providers: [BullMQProvider, BullMQDLQProvider],
  exports: [BullMQProvider, BullMQDLQProvider],
})
export class QueueModule {}
