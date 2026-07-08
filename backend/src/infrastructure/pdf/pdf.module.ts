import { Module } from '@nestjs/common';
import { PDF_RENDERER } from '../../application/ports/pdf-renderer.port';
import { PdfKitRenderer } from './pdf-kit.renderer';

@Module({
  providers: [
    {
      provide: PDF_RENDERER,
      useClass: PdfKitRenderer,
    },
  ],
  exports: [PDF_RENDERER],
})
export class PdfModule {}
