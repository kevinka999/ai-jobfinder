import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import {
  ListApplicationsQueryDto,
  UpdateApplicationRequestDto,
} from './application-request.dto';
import { ApplicationResponseDto } from './application-response.dto';
import { GetApplicationUseCase } from './get-application.use-case';
import { ListApplicationsUseCase } from './list-applications.use-case';
import { UpdateApplicationUseCase } from './update-application.use-case';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly listApplicationsUseCase: ListApplicationsUseCase,
    private readonly getApplicationUseCase: GetApplicationUseCase,
    private readonly updateApplicationUseCase: UpdateApplicationUseCase,
  ) {}

  @Get()
  async listApplications(
    @Query() query: ListApplicationsQueryDto,
  ): Promise<ApplicationResponseDto[]> {
    const applications = await this.listApplicationsUseCase.execute({
      status: query.status,
    });

    return applications.map((application) =>
      ApplicationResponseDto.fromDomain(application),
    );
  }

  @Get(':applicationId')
  async getApplication(
    @Param('applicationId') applicationId: string,
  ): Promise<ApplicationResponseDto> {
    const application = await this.getApplicationUseCase.execute({
      applicationId,
    });

    return ApplicationResponseDto.fromDomain(application);
  }

  @Patch(':applicationId')
  async updateApplication(
    @Param('applicationId') applicationId: string,
    @Body() request: UpdateApplicationRequestDto,
  ): Promise<ApplicationResponseDto> {
    const application = await this.updateApplicationUseCase.execute({
      applicationId,
      status: request.status,
      notes: request.notes,
    });

    return ApplicationResponseDto.fromDomain(application);
  }
}
