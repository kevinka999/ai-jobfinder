import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApplicationResponseDto } from '../applications/application-response.dto';
import { ApplyJobUseCase } from './apply-job.use-case';
import { CreateJobUseCase } from './create-job.use-case';
import { DeleteJobUseCase } from './delete-job.use-case';
import { GetJobUseCase } from './get-job.use-case';
import { ImportJobsUseCase } from './import-jobs.use-case';
import { ImportJobsResponseDto } from './import-jobs.dto';
import { JobResponseDto } from './job-response.dto';
import {
  CreateJobRequestDto,
  ListJobsQueryDto,
  UpdateJobFavoriteRequestDto,
  UpdateJobRequestDto,
} from './job-request.dto';
import { KeepDraftJobUseCase } from './keep-draft-job.use-case';
import { ListJobsUseCase } from './list-jobs.use-case';
import { UpdateJobFavoriteUseCase } from './update-job-favorite.use-case';
import { UpdateJobUseCase } from './update-job.use-case';

@Controller('jobs')
export class JobsController {
  constructor(
    private readonly importJobsUseCase: ImportJobsUseCase,
    private readonly listJobsUseCase: ListJobsUseCase,
    private readonly getJobUseCase: GetJobUseCase,
    private readonly createJobUseCase: CreateJobUseCase,
    private readonly updateJobUseCase: UpdateJobUseCase,
    private readonly updateJobFavoriteUseCase: UpdateJobFavoriteUseCase,
    private readonly keepDraftJobUseCase: KeepDraftJobUseCase,
    private readonly deleteJobUseCase: DeleteJobUseCase,
    private readonly applyJobUseCase: ApplyJobUseCase,
  ) {}

  @Get()
  async listJobs(@Query() query: ListJobsQueryDto): Promise<JobResponseDto[]> {
    const jobs = await this.listJobsUseCase.execute({ status: query.status });

    return jobs.map((job) => JobResponseDto.fromDomain(job));
  }

  @Get(':jobId')
  async getJob(@Param('jobId') jobId: string): Promise<JobResponseDto> {
    const job = await this.getJobUseCase.execute({ jobId });

    return JobResponseDto.fromDomain(job);
  }

  @Post()
  async createJob(
    @Body() request: CreateJobRequestDto,
  ): Promise<JobResponseDto> {
    const job = await this.createJobUseCase.execute(request);

    return JobResponseDto.fromDomain(job);
  }

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

  @Patch(':jobId')
  async updateJob(
    @Param('jobId') jobId: string,
    @Body() request: UpdateJobRequestDto,
  ): Promise<JobResponseDto> {
    const job = await this.updateJobUseCase.execute({
      jobId,
      fields: request,
    });

    return JobResponseDto.fromDomain(job);
  }

  @Patch(':jobId/favorite')
  async updateJobFavorite(
    @Param('jobId') jobId: string,
    @Body() request: UpdateJobFavoriteRequestDto,
  ): Promise<JobResponseDto> {
    const job = await this.updateJobFavoriteUseCase.execute({
      jobId,
      isFavorite: request.isFavorite,
    });

    return JobResponseDto.fromDomain(job);
  }

  @Post(':jobId/keep')
  async keepDraftJob(@Param('jobId') jobId: string): Promise<JobResponseDto> {
    const job = await this.keepDraftJobUseCase.execute({ jobId });

    return JobResponseDto.fromDomain(job);
  }

  @Delete(':jobId')
  deleteJob(@Param('jobId') jobId: string): Promise<{ deleted: true }> {
    return this.deleteJobUseCase.execute({ jobId });
  }

  @Post(':jobId/apply')
  async applyJob(
    @Param('jobId') jobId: string,
  ): Promise<ApplicationResponseDto> {
    const result = await this.applyJobUseCase.execute({ jobId });

    return ApplicationResponseDto.fromDomain(result);
  }
}
