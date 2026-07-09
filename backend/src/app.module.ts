import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApplicationsController } from './application/use-cases/applications/applications.controller';
import { GetApplicationUseCase } from './application/use-cases/applications/get-application.use-case';
import { ListApplicationsUseCase } from './application/use-cases/applications/list-applications.use-case';
import { UpdateApplicationUseCase } from './application/use-cases/applications/update-application.use-case';
import { CoverLettersController } from './application/use-cases/cover-letters/cover-letters.controller';
import { GenerateCoverLetterDraftUseCase } from './application/use-cases/cover-letters/generate-cover-letter-draft.use-case';
import { GenerateCoverLetterPdfUseCase } from './application/use-cases/cover-letters/generate-cover-letter-pdf.use-case';
import { ReviseCoverLetterDraftUseCase } from './application/use-cases/cover-letters/revise-cover-letter-draft.use-case';
import { GenerateJobSearchPromptUseCase } from './application/use-cases/job-search/generate-job-search-prompt.use-case';
import { JobSearchController } from './application/use-cases/job-search/job-search.controller';
import { ApplyJobUseCase } from './application/use-cases/jobs/apply-job.use-case';
import { CreateJobUseCase } from './application/use-cases/jobs/create-job.use-case';
import { DeleteDraftJobUseCase } from './application/use-cases/jobs/delete-draft-job.use-case';
import { GetJobUseCase } from './application/use-cases/jobs/get-job.use-case';
import { ImportJobsUseCase } from './application/use-cases/jobs/import-jobs.use-case';
import { JobsController } from './application/use-cases/jobs/jobs.controller';
import { KeepDraftJobUseCase } from './application/use-cases/jobs/keep-draft-job.use-case';
import { ListJobsUseCase } from './application/use-cases/jobs/list-jobs.use-case';
import { UpdateJobUseCase } from './application/use-cases/jobs/update-job.use-case';
import { ResolveDefaultUserUseCase } from './application/use-cases/users/resolve-default-user.use-case';
import { SaveCoverLetterInstructionTemplateUseCase } from './application/use-cases/users/save-cover-letter-instruction-template.use-case';
import { SaveResumeUseCase } from './application/use-cases/users/save-resume.use-case';
import { UsersController } from './application/use-cases/users/users.controller';
import { AiModule } from './infrastructure/ai/ai.module';
import { validateEnvironment } from './infrastructure/config/validate-environment';
import { DatabaseModule } from './infrastructure/database/database.module';
import { PdfModule } from './infrastructure/pdf/pdf.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AiModule,
    DatabaseModule,
    PdfModule,
  ],
  controllers: [
    AppController,
    UsersController,
    JobSearchController,
    JobsController,
    ApplicationsController,
    CoverLettersController,
  ],
  providers: [
    AppService,
    ResolveDefaultUserUseCase,
    SaveResumeUseCase,
    SaveCoverLetterInstructionTemplateUseCase,
    GenerateJobSearchPromptUseCase,
    ImportJobsUseCase,
    ListJobsUseCase,
    GetJobUseCase,
    CreateJobUseCase,
    UpdateJobUseCase,
    KeepDraftJobUseCase,
    DeleteDraftJobUseCase,
    ApplyJobUseCase,
    ListApplicationsUseCase,
    GetApplicationUseCase,
    UpdateApplicationUseCase,
    GenerateCoverLetterDraftUseCase,
    ReviseCoverLetterDraftUseCase,
    GenerateCoverLetterPdfUseCase,
  ],
})
export class AppModule {}
