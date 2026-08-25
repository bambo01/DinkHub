import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "outline" | "outline-light";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-secondary font-semibold hover:opacity-90",
  secondary: "bg-secondary text-white hover:opacity-90",
  outline: "border border-gray-200 text-secondary hover:bg-secondary/10",
  "outline-light": "border border-white/60 text-white hover:bg-white/10",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
