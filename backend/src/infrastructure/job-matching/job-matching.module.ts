import { Module } from '@nestjs/common';
import { JobMatchingQueueService } from './job-matching-queue.service';

@Module({ providers: [JobMatchingQueueService], exports: [JobMatchingQueueService] })
export class JobMatchingModule {}
