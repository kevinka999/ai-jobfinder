import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { JobSearchPromptRequestDto } from './job-search-prompt.dto';

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
});
