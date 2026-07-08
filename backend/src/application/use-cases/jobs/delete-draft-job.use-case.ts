import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JOB_REPOSITORY } from '../../ports/job-repository.port';
import type { JobRepository } from '../../ports/job-repository.port';
import { USER_REPOSITORY } from '../../ports/user-repository.port';
import type { UserRepository } from '../../ports/user-repository.port';

@Injectable()
export class DeleteDraftJobUseCase {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    @Inject(JOB_REPOSITORY)
    private readonly jobRepository: JobRepository,
  ) {}

  async execute(input: { jobId: string }): Promise<{ deleted: true }> {
    const user = await this.userRepository.resolveDefaultUser();
    const job = await this.jobRepository.findById({
      userId: user.id,
      jobId: input.jobId,
    });

    if (!job) {
      throw new NotFoundException('Job was not found.');
    }

    if (job.status !== 'draft') {
      throw new BadRequestException('Only draft jobs can be deleted.');
    }

    const deleted = await this.jobRepository.delete({
      userId: user.id,
      jobId: input.jobId,
    });

    if (!deleted) {
      throw new NotFoundException('Job was not found.');
    }

    return { deleted: true };
  }
}
