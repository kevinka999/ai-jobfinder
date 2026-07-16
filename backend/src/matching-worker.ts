import { NestFactory } from '@nestjs/core';
import { JobMatchingWorkerModule } from './infrastructure/job-matching/job-matching-worker.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(JobMatchingWorkerModule);
}
void bootstrap();
