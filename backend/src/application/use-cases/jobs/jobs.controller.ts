import { Body, Controller, Post } from '@nestjs/common';
import { ImportJobsUseCase } from './import-jobs.use-case';
import { ImportJobsResponseDto } from './import-jobs.dto';
import { JobResponseDto } from './job-response.dto';

@Controller('jobs')
export class JobsController {
  constructor(private readonly importJobsUseCase: ImportJobsUseCase) {}

  @Post('import')
  async importJobs(@Body() request: unknown): Promise<ImportJobsResponseDto> {
    const result = await this.importJobsUseCase.execute(request);

    return {
      createdActiveJobs: result.createdActiveJobs.map((job) =>
        JobResponseDto.fromDomain(job),
      ),
      createdDraftJobs: result.createdDraftJobs.map((job) =>
        JobResponseDto.fromDomain(job),
      ),
      invalidRows: result.invalidRows,
      summary: result.summary,
    };
  }
}
