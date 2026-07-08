import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';

type FieldProps = {
  children: ReactNode;
  label: string;
};

export function Field({ children, label }: FieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextInput({ label, ...props }: TextInputProps) {
  return (
    <Field label={label}>
      <input {...props} />
    </Field>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function Textarea({ label, ...props }: TextareaProps) {
  return (
    <Field label={label}>
      <textarea {...props} />
    </Field>
  );
}
