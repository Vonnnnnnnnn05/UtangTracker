import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldProps = {
  label: string;
  error?: string;
  helper?: string;
};

type InputProps = FieldProps & InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, error, helper, id, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;
  const describedBy = error ? `${inputId}-error` : helper ? `${inputId}-helper` : undefined;

  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={inputId}>
      {label}
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`focus-ring mt-2 min-h-11 w-full rounded-md border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted/70 ${className}`}
        {...props}
      />
      {helper ? (
        <span id={`${inputId}-helper`} className="mt-1 block text-xs font-normal text-muted">
          {helper}
        </span>
      ) : null}
      {error ? (
        <span id={`${inputId}-error`} role="alert" className="mt-1 block text-xs font-semibold text-clay">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type TextareaProps = FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, error, helper, id, className = "", ...props }: TextareaProps) {
  const inputId = id ?? props.name;

  return (
    <label className="block text-sm font-semibold text-ink" htmlFor={inputId}>
      {label}
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        className={`focus-ring mt-2 min-h-24 w-full resize-y rounded-md border border-line bg-white px-3 py-2 text-base text-ink placeholder:text-muted/70 ${className}`}
        {...props}
      />
      {helper ? <span className="mt-1 block text-xs font-normal text-muted">{helper}</span> : null}
      {error ? <span className="mt-1 block text-xs font-semibold text-clay">{error}</span> : null}
    </label>
  );
}
