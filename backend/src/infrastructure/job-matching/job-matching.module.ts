import { Module } from '@nestjs/common';
import { JobMatchingQueueService } from './job-matching-queue.service';
import { JOB_MATCHING_EVALUATOR } from '../../application/ports/job-matching-evaluator.port';
import { DeterministicJobMatchingEvaluator } from './deterministic-job-matching.evaluator';

@Module({ providers: [JobMatchingQueueService, DeterministicJobMatchingEvaluator, { provide: JOB_MATCHING_EVALUATOR, useExisting: DeterministicJobMatchingEvaluator }], exports: [JobMatchingQueueService, JOB_MATCHING_EVALUATOR] })
export class JobMatchingModule {}
