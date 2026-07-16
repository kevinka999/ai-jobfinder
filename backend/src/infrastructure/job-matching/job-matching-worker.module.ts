import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from '../config/validate-environment';
import { JobMatchingWorkerRunner } from './job-matching-worker-runner.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment })],
  providers: [JobMatchingWorkerRunner],
})
export class JobMatchingWorkerModule {}
