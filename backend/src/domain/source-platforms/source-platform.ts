export const SOURCE_PLATFORM_IDS = [
  'linkedin',
  'stepstone',
  'karriere',
  'willhaben',
  'manual',
] as const;

export type SourcePlatformId = (typeof SOURCE_PLATFORM_IDS)[number];

export const SEARCHABLE_SOURCE_PLATFORM_IDS = [
  'linkedin',
  'stepstone',
  'karriere',
  'willhaben',
] as const satisfies readonly SourcePlatformId[];

export const SOURCE_PLATFORMS: Record<
  SourcePlatformId,
  { id: SourcePlatformId; label: string }
> = {
  linkedin: { id: 'linkedin', label: 'LinkedIn' },
  stepstone: { id: 'stepstone', label: 'StepStone' },
  karriere: { id: 'karriere', label: 'karriere.at' },
  willhaben: { id: 'willhaben', label: 'willhaben' },
  manual: { id: 'manual', label: 'Manual link' },
};
