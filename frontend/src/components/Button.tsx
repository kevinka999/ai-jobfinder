import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cx } from '../lib/classNames';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
};

export function Button({
  children,
  icon,
  variant = 'secondary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  const iconOnly = !children;

  return (
    <button
      className={cx(
        'inline-flex min-h-9 cursor-pointer items-center justify-center gap-inline rounded-control border text-sm font-semibold leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-60',
        iconOnly ? 'w-9 px-0' : 'px-control-x',
        variant === 'primary' &&
          'border-brand-600 bg-brand-600 text-white hover:bg-brand-700',
        variant === 'secondary' &&
          'border-app-border-strong bg-app-surface text-app-text hover:bg-app-surface-muted',
        variant === 'danger' &&
          'border-danger-300 bg-danger-50 text-danger-700 hover:bg-danger-100',
        variant === 'ghost' &&
          'border-transparent bg-transparent text-app-text-soft hover:bg-app-surface-muted',
        className,
      )}
      type={type}
      {...props}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
