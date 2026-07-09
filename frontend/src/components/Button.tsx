import type { ButtonHTMLAttributes, ReactNode } from 'react';

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
  return (
    <button
      className={`button button-${variant} ${className}`.trim()}
      type={type}
      {...props}
    >
      {icon}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
