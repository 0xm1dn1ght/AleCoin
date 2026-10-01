import type { ButtonHTMLAttributes } from "react";

export const BUSY_WALLET = "Подтвердите в MetaMask…";
export const BUSY_NETWORK = "Ждём сеть…";

const VARIANTS = {
  primary: "bg-amber text-pub enabled:hover:brightness-110",
  secondary: "border border-amber text-amber enabled:hover:bg-glow",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  busy?: string | null;
};

export function Button({
  variant = "primary",
  busy = null,
  disabled,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      {...rest}
      disabled={disabled || busy !== null}
      className={`inline-flex min-h-11 items-center justify-center rounded-lg px-5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${VARIANTS[variant]} ${className}`}
    >
      {busy ?? children}
    </button>
  );
}
