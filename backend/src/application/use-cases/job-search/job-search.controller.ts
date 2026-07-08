import { Body, Controller, Post } from '@nestjs/common';
import { GenerateJobSearchPromptUseCase } from './generate-job-search-prompt.use-case';
import {
  JobSearchPromptRequestDto,
  JobSearchPromptResponseDto,
} from './job-search-prompt.dto';

@Controller('job-search')
export class JobSearchController {
  constructor(
    private readonly generateJobSearchPromptUseCase: GenerateJobSearchPromptUseCase,
  ) {}

  @Post('prompt')
  execute(
    @Body() request: JobSearchPromptRequestDto,
  ): Promise<JobSearchPromptResponseDto> {
    return this.generateJobSearchPromptUseCase.execute({
      sourcePlatformIds: request.sourcePlatformIds,
      cities: request.cities,
      workModels: request.workModels,
    });
  }
}
