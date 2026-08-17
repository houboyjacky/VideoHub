import React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "subtle" | "glow";
}

export function GlassCard({
  children,
  className,
  variant = "default",
  ...props
}: GlassCardProps) {
  const variantStyles = {
    default: "glass-card",
    subtle: "glass-panel rounded-2xl",
    glow: "glass-card hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]",
  };

  return (
    <div
      className={cn(
        "rounded-2xl p-6 relative overflow-hidden",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;
