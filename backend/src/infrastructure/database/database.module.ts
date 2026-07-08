import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JOB_REPOSITORY } from '../../application/ports/job-repository.port';
import { USER_REPOSITORY } from '../../application/ports/user-repository.port';
import { MongoJobRepository } from './repositories/mongo-job.repository';
import { MongoUserRepository } from './repositories/mongo-user.repository';
import { Application, ApplicationSchema } from './schemas/application.schema';
import { Job, JobSchema } from './schemas/job.schema';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Job.name, schema: JobSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [
    {
      provide: JOB_REPOSITORY,
      useClass: MongoJobRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: MongoUserRepository,
    },
  ],
  exports: [JOB_REPOSITORY, USER_REPOSITORY],
})
export class DatabaseModule {}
