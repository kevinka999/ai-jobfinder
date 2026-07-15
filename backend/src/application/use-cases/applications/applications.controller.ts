import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ListApplicationsQueryDto,
  UpdateApplicationRequestDto,
} from './application-request.dto';
import { ApplicationResponseDto } from './application-response.dto';
import {
  CompanyApplicationHistoryRequestDto,
  CompanyApplicationHistoryResponseDto,
} from './company-application-history.dto';
import { GetApplicationUseCase } from './get-application.use-case';
import { ListCompanyApplicationHistoryUseCase } from './list-company-application-history.use-case';
import { ListApplicationsUseCase } from './list-applications.use-case';
import { UpdateApplicationUseCase } from './update-application.use-case';

@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly listApplicationsUseCase: ListApplicationsUseCase,
    private readonly getApplicationUseCase: GetApplicationUseCase,
    private readonly updateApplicationUseCase: UpdateApplicationUseCase,
    private readonly listCompanyApplicationHistoryUseCase: ListCompanyApplicationHistoryUseCase,
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

  @Post('company-history')
  async listCompanyApplicationHistory(
    @Body() request: CompanyApplicationHistoryRequestDto,
  ): Promise<CompanyApplicationHistoryResponseDto[]> {
    const histories = await this.listCompanyApplicationHistoryUseCase.execute({
      jobIds: request.jobIds,
    });

    return histories.map((history) =>
      CompanyApplicationHistoryResponseDto.fromUseCase(history),
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
