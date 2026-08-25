import { ComponentProps, ReactNode } from "react";
import Link from "next/link";
import type { IconType } from "react-icons";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface LinkButtonProps extends Omit<ComponentProps<typeof Button>, "children"> {
  href: string;
  icon?: IconType;
  children: ReactNode;
  linkClassName?: string;
  onLinkClick?: () => void;
}

export function LinkButton({
  href,
  icon: Icon,
  children,
  className,
  linkClassName,
  onLinkClick,
  ...props
}: LinkButtonProps) {
  return (
    <Link href={href} className={linkClassName} onClick={onLinkClick}>
      <Button
        className={cn("flex items-center justify-center gap-1.5", className)}
        {...props}
      >
        {Icon && <Icon className="h-4 w-4" />}
        {children}
      </Button>
    </Link>
  );
}
