import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnvironment } from '../config/validate-environment';
import { JobMatchingWorkerRunner } from './job-matching-worker-runner.service';
import { DatabaseModule } from '../database/database.module';
import { JobMatchingModule } from './job-matching.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }), DatabaseModule, JobMatchingModule],
  providers: [JobMatchingWorkerRunner],
})
export class JobMatchingWorkerModule {}
