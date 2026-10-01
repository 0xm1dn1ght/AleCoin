import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function TextField({ label, className = "", ...rest }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-muted">{label}</span>
      <input
        {...rest}
        className={`min-h-11 w-full rounded-lg border border-line bg-transparent px-3 text-base text-cream placeholder:text-cream/40 focus:border-amber focus:outline-none ${className}`}
      />
    </label>
  );
}
