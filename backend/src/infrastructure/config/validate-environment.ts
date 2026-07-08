type EnvironmentConfig = {
  MONGODB_URI?: string;
  PORT?: string;
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
    PORT: port,
  };
}
