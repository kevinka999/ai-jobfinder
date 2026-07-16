type EnvironmentConfig = {
  MONGODB_URI?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  PORT?: string;
  REDIS_URL?: string;
  JOB_MATCHING_CONCURRENCY?: string;
  JOB_MATCHING_ATTEMPTS?: string;
  JOB_MATCHING_RETRY_DELAY_MS?: string;
  JOB_MATCHING_COMPLETED_RETENTION?: string;
  JOB_MATCHING_FAILED_RETENTION?: string;
};

export function validateEnvironment(
  config: EnvironmentConfig,
): Record<string, string | number> {
  const port = Number(config.PORT ?? 3000);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }

  return {
    MONGODB_URI: config.MONGODB_URI ?? 'mongodb://localhost:27017/ai-jobfinder',
    OPENAI_API_KEY: config.OPENAI_API_KEY ?? '',
    OPENAI_MODEL: config.OPENAI_MODEL ?? 'gpt-4.1-mini',
    PORT: port,
    REDIS_URL: config.REDIS_URL ?? 'redis://localhost:6379',
    JOB_MATCHING_CONCURRENCY: positiveInteger(config.JOB_MATCHING_CONCURRENCY, 2, 'JOB_MATCHING_CONCURRENCY'),
    JOB_MATCHING_ATTEMPTS: positiveInteger(config.JOB_MATCHING_ATTEMPTS, 3, 'JOB_MATCHING_ATTEMPTS'),
    JOB_MATCHING_RETRY_DELAY_MS: positiveInteger(config.JOB_MATCHING_RETRY_DELAY_MS, 1000, 'JOB_MATCHING_RETRY_DELAY_MS'),
    JOB_MATCHING_COMPLETED_RETENTION: positiveInteger(config.JOB_MATCHING_COMPLETED_RETENTION, 500, 'JOB_MATCHING_COMPLETED_RETENTION'),
    JOB_MATCHING_FAILED_RETENTION: positiveInteger(config.JOB_MATCHING_FAILED_RETENTION, 500, 'JOB_MATCHING_FAILED_RETENTION'),
  };
}

function positiveInteger(value: string | undefined, fallback: number, name: string): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`${name} must be a positive integer.`);
  return parsed;
}
