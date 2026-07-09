import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  JobLinksPromptRequestDto,
  JobSearchPromptRequestDto,
} from './job-search-prompt.dto';

describe('JobSearchPromptRequestDto', () => {
  it('accepts selected platforms, free-text cities, and selected work models', async () => {
    const dto = plainToInstance(JobSearchPromptRequestDto, {
      sourcePlatformIds: ['linkedin', 'stepstone'],
      cities: [' Vienna ', 'Salzburg'],
      workModels: ['hybrid', 'remote'],
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.cities).toEqual(['Vienna', 'Salzburg']);
  });

  it('rejects unknown platform IDs, empty cities, and unknown work models', async () => {
    const dto = plainToInstance(JobSearchPromptRequestDto, {
      sourcePlatformIds: ['indeed'],
      cities: ['  '],
      workModels: ['distributed'],
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual([
      'sourcePlatformIds',
      'cities',
      'workModels',
    ]);
  });

  it('rejects manual source IDs for platform search prompts', async () => {
    const dto = plainToInstance(JobSearchPromptRequestDto, {
      sourcePlatformIds: ['manual'],
      cities: ['Vienna'],
      workModels: ['hybrid'],
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual([
      'sourcePlatformIds',
    ]);
  });
});

describe('JobLinksPromptRequestDto', () => {
  it('accepts and trims one or more job links', async () => {
    const dto = plainToInstance(JobLinksPromptRequestDto, {
      jobLinks: [' https://example.com/jobs/1 ', 'https://jobs.example.com/2'],
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.jobLinks).toEqual([
      'https://example.com/jobs/1',
      'https://jobs.example.com/2',
    ]);
  });

  it('rejects empty or non-URL job links', async () => {
    const dto = plainToInstance(JobLinksPromptRequestDto, {
      jobLinks: ['  ', 'not-a-url'],
    });

    const errors = await validate(dto);

    expect(errors.map((error) => error.property)).toEqual(['jobLinks']);
  });
});
