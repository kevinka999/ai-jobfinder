import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/classNames';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'dangerPrimary'
  | 'ghost';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  isLoading?: boolean;
  variant?: ButtonVariant;
};

export function Button({
  children,
  disabled,
  icon,
  isLoading = false,
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const iconOnly = !children;

  return (
    <button
      aria-busy={isLoading || undefined}
      className={cx(
        'inline-flex min-h-9 cursor-pointer items-center justify-center gap-inline rounded-control border text-sm font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-70',
        iconOnly ? 'w-9 px-0' : 'px-control-x',
        variant === 'primary' &&
          'border-brand-600 bg-brand-600 text-white hover:bg-brand-700',
        variant === 'secondary' &&
          'border-app-border-strong bg-app-surface text-app-text hover:bg-app-surface-muted',
        variant === 'success' &&
          'border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100',
        variant === 'danger' &&
          'border-danger-300 bg-danger-50 text-danger-700 hover:bg-danger-100',
        variant === 'dangerPrimary' &&
          'border-danger-700 bg-danger-700 text-white hover:bg-danger-700',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-app-text-soft hover:bg-app-surface-muted',
        isLoading && 'button-loading-dash border-dashed',
        className,
      )}
      disabled={disabled || isLoading}
      type={type}
      {...props}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
