import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button } from './Button';
import type { ButtonVariant } from './Button';

type ConfirmActionButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'children' | 'onClick'
> & {
  ariaLabel: string;
  confirmAriaLabel: string;
  confirmDurationMs?: number;
  confirmTitle: string;
  confirmVariant?: ButtonVariant;
  icon: ReactNode;
  isLoading?: boolean;
  onConfirm: () => Promise<void> | void;
  title: string;
  variant?: ButtonVariant;
};

const DEFAULT_CONFIRM_DURATION_MS = 3000;

export function ConfirmActionButton({
  ariaLabel,
  confirmAriaLabel,
  confirmDurationMs = DEFAULT_CONFIRM_DURATION_MS,
  confirmTitle,
  confirmVariant = 'primary',
  disabled,
  icon,
  isLoading = false,
  onBlur,
  onConfirm,
  onKeyDown,
  title,
  variant = 'secondary',
  ...props
}: ConfirmActionButtonProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (isLoading || disabled) {
      setIsConfirming(false);
    }
  }, [disabled, isLoading]);

  useEffect(() => {
    if (!isConfirming) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setIsConfirming(false);
    }, confirmDurationMs);

    return () => window.clearTimeout(timeoutId);
  }, [confirmDurationMs, isConfirming]);

  function handleClick() {
    if (disabled || isLoading) {
      return;
    }

    if (!isConfirming) {
      setIsConfirming(true);
      return;
    }

    setIsConfirming(false);
    void onConfirm();
  }

  return (
    <Button
      aria-label={isConfirming ? confirmAriaLabel : ariaLabel}
      aria-pressed={isConfirming || undefined}
      disabled={disabled}
      icon={icon}
      isLoading={isLoading}
      onBlur={(event) => {
        setIsConfirming(false);
        onBlur?.(event);
      }}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setIsConfirming(false);
        }
        onKeyDown?.(event);
      }}
      title={isConfirming ? confirmTitle : title}
      variant={isConfirming ? confirmVariant : variant}
      {...props}
    />
  );
}
