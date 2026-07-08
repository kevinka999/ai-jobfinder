import { Body, Controller, Header, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import {
  CoverLetterDraftResponseDto,
  GenerateCoverLetterDraftRequestDto,
  GenerateCoverLetterPdfRequestDto,
  ReviseCoverLetterDraftRequestDto,
} from './cover-letter-request.dto';
import { GenerateCoverLetterDraftUseCase } from './generate-cover-letter-draft.use-case';
import { GenerateCoverLetterPdfUseCase } from './generate-cover-letter-pdf.use-case';
import { ReviseCoverLetterDraftUseCase } from './revise-cover-letter-draft.use-case';

@Controller('cover-letters')
export class CoverLettersController {
  constructor(
    private readonly generateCoverLetterDraftUseCase: GenerateCoverLetterDraftUseCase,
    private readonly reviseCoverLetterDraftUseCase: ReviseCoverLetterDraftUseCase,
    private readonly generateCoverLetterPdfUseCase: GenerateCoverLetterPdfUseCase,
  ) {}

  @Post('draft')
  generateDraft(
    @Body() request: GenerateCoverLetterDraftRequestDto,
  ): Promise<CoverLetterDraftResponseDto> {
    return this.generateCoverLetterDraftUseCase.execute({
      jobId: request.jobId,
      userInstructions: request.userInstructions,
    });
  }

  @Post('revise')
  reviseDraft(
    @Body() request: ReviseCoverLetterDraftRequestDto,
  ): Promise<CoverLetterDraftResponseDto> {
    return this.reviseCoverLetterDraftUseCase.execute({
      jobId: request.jobId,
      currentDraftMarkdown: request.currentDraftMarkdown,
      revisionInstructions: request.revisionInstructions,
    });
  }

  @Post('pdf')
  @Header('Content-Type', 'application/pdf')
  async generatePdf(
    @Body() request: GenerateCoverLetterPdfRequestDto,
    @Res() response: Response,
  ): Promise<void> {
    const result = await this.generateCoverLetterPdfUseCase.execute({
      jobId: request.jobId,
      finalDraftMarkdown: request.finalDraftMarkdown,
    });

    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.filename}"`,
    );
    response.end(result.pdf);
  }
}
