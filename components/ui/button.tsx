import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  children: ReactNode;
};

const variants = {
  primary: "bg-leaf text-white hover:bg-[#25563F] active:bg-[#1F4936]",
  secondary: "border border-line bg-surface text-ink hover:bg-white active:bg-mint",
  danger: "bg-clay text-white hover:bg-[#9F4528] active:bg-[#84371F]",
  ghost: "text-ink hover:bg-mint active:bg-[#D2E5DA]",
};

export function Button({ className = "", variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={`focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
