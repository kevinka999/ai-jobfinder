import { Star } from 'lucide-react';
import { Button } from './Button';
import { cx } from '../lib/classNames';
import type { JobResponse } from '../lib/types';

type JobFavoriteButtonProps = {
  isLoading?: boolean;
  job: JobResponse;
  onToggle: (job: JobResponse) => void;
};

export function JobFavoriteButton({
  isLoading = false,
  job,
  onToggle,
}: JobFavoriteButtonProps) {
  const label = job.isFavorite
    ? 'Remove job from favorites'
    : 'Add job to favorites';

  return (
    <Button
      aria-label={label}
      className="shrink-0 text-app-text-muted hover:text-warning-700"
      icon={
        <Star
          aria-hidden="true"
          className={cx(job.isFavorite && 'text-warning-700')}
          fill={job.isFavorite ? 'currentColor' : 'none'}
          size={15}
        />
      }
      isLoading={isLoading}
      onClick={() => onToggle(job)}
      title={label}
      variant="ghost"
    />
  );
}
