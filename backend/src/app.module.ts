import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResolveDefaultUserUseCase } from './application/use-cases/users/resolve-default-user.use-case';
import { SaveResumeUseCase } from './application/use-cases/users/save-resume.use-case';
import { UsersController } from './application/use-cases/users/users.controller';
import { AiModule } from './infrastructure/ai/ai.module';
import { validateEnvironment } from './infrastructure/config/validate-environment';
import { DatabaseModule } from './infrastructure/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    AiModule,
    DatabaseModule,
  ],
  controllers: [AppController, UsersController],
  providers: [AppService, ResolveDefaultUserUseCase, SaveResumeUseCase],
})
export class AppModule {}
