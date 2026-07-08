export const SOURCE_PLATFORM_IDS = [
  'linkedin',
  'stepstone',
  'karriere',
  'willhaben',
] as const;

export type SourcePlatformId = (typeof SOURCE_PLATFORM_IDS)[number];

export const SOURCE_PLATFORMS: Record<
  SourcePlatformId,
  { id: SourcePlatformId; label: string }
> = {
  linkedin: { id: 'linkedin', label: 'LinkedIn' },
  stepstone: { id: 'stepstone', label: 'StepStone' },
  karriere: { id: 'karriere', label: 'karriere.at' },
  willhaben: { id: 'willhaben', label: 'willhaben' },
};
