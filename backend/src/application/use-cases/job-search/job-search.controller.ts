import { Body, Controller, Post } from '@nestjs/common';
import {
  GenerateJobLinksPromptUseCase,
  GenerateJobSearchPromptUseCase,
} from './generate-job-search-prompt.use-case';
import {
  JobLinksPromptRequestDto,
  JobSearchPromptRequestDto,
  JobSearchPromptResponseDto,
} from './job-search-prompt.dto';

@Controller('job-search')
export class JobSearchController {
  constructor(
    private readonly generateJobSearchPromptUseCase: GenerateJobSearchPromptUseCase,
    private readonly generateJobLinksPromptUseCase: GenerateJobLinksPromptUseCase,
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

  @Post('links/prompt')
  generateFromLinks(
    @Body() request: JobLinksPromptRequestDto,
  ): Promise<JobSearchPromptResponseDto> {
    return this.generateJobLinksPromptUseCase.execute({
      jobLinks: request.jobLinks,
    });
  }
}
