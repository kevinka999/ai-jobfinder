import { Check } from 'lucide-react';
import { cx } from '../lib/classNames';

type StepperStep = {
  id: string;
  label: string;
};

type StepperProps = {
  currentStep: number;
  steps: StepperStep[];
};

export function Stepper({ currentStep, steps }: StepperProps) {
  return (
    <ol className="grid grid-cols-[repeat(auto-fit,minmax(0,1fr))] gap-inline">
      {steps.map((step, index) => {
        const status =
          index < currentStep
            ? 'complete'
            : index === currentStep
              ? 'current'
              : 'upcoming';

        return (
          <li
            aria-current={status === 'current' ? 'step' : undefined}
            className="grid min-w-0 gap-1.5 text-center"
            key={step.id}
          >
            <div className="flex min-w-0 items-center justify-center gap-1.5">
              <span
                className={cx(
                  'inline-flex size-5 shrink-0 items-center justify-center rounded-pill border text-[0.6875rem] font-bold',
                  status === 'complete' && 'border-brand-600 bg-brand-600 text-white',
                  status === 'current' &&
                    'border-brand-700 bg-brand-50 text-brand-700',
                  status === 'upcoming' &&
                    'border-app-border-strong bg-app-surface-muted text-app-text-muted',
                )}
              >
                {status === 'complete' ? <Check size={12} /> : index + 1}
              </span>
              <span
                className={cx(
                  'min-w-0 truncate text-xs font-bold',
                  status === 'upcoming'
                    ? 'text-app-text-muted'
                    : 'text-app-text',
                )}
              >
                {step.label}
              </span>
            </div>
            <div
              className={cx(
                'h-1.5 rounded-pill',
                status === 'complete' && 'bg-brand-600',
                status === 'current' && 'bg-brand-700',
                status === 'upcoming' && 'bg-app-border',
              )}
            />
          </li>
        );
      })}
    </ol>
  );
}
