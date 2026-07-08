import { Module } from '@nestjs/common';
import { AI_PROVIDER } from '../../application/ports/ai-provider.port';
import { OpenAiProvider } from './open-ai.provider';

@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: OpenAiProvider,
    },
  ],
  exports: [AI_PROVIDER],
})
export class AiModule {}
