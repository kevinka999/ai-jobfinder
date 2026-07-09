import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cx } from '../lib/classNames';

export const fieldClassName = 'grid gap-1.5';

export const fieldLabelClassName =
  'text-xs font-bold text-app-text-soft';

export const controlClassName =
  'w-full rounded-control border border-app-border-strong bg-app-surface text-app-text outline-none focus:border-brand-600 focus:shadow-focus';

export const inputClassName = `${controlClassName} h-9 px-2.5`;

export const textareaClassName = `${controlClassName} min-h-30 resize-y px-2.5 py-2.5`;

type FieldProps = {
  children: ReactNode;
  label: string;
};

export function Field({ children, label }: FieldProps) {
  return (
    <label className={fieldClassName}>
      <span className={fieldLabelClassName}>{label}</span>
      {children}
    </label>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextInput({ className, label, ...props }: TextInputProps) {
  return (
    <Field label={label}>
      <input className={cx(inputClassName, className)} {...props} />
    </Field>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({ className, label, ...props }: TextareaProps) {
  return (
    <Field label={label}>
      <textarea className={cx(textareaClassName, className)} {...props} />
    </Field>
  );
}
