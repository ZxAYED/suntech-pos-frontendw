"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg";
  inverse?: boolean;
  iconOnly?: boolean;
  href?: string;
  className?: string;
}

export function BrandLogo({
  size = "md",
  inverse = false,
  iconOnly = false,
  href = "/",
  className,
}: BrandLogoProps) {
  // logo.png is 717x243 (aspect ratio ~2.95:1)
  const sizeMap = {
    sm: { width: 106, height: 36, iconSize: 32 },
    md: { width: 130, height: 44, iconSize: 38 },
    lg: { width: 160, height: 54, iconSize: 46 },
  };

  const currentSize = sizeMap[size];

  const content = iconOnly ? (
    // Icon-only view for collapsed sidebar: show the S mark cleanly without borders or boxes
    <div
      className={cn(
        "relative overflow-hidden flex items-center justify-center shrink-0 cursor-pointer select-none",
        className,
      )}
      style={{ width: currentSize.iconSize, height: currentSize.iconSize }}
      title="SunTech POS"
    >
      <div className="relative w-full h-full overflow-hidden flex items-center justify-start">
        <Image
          src="/images/logo.png"
          alt="SunTech Logo"
          width={currentSize.width}
          height={currentSize.height}
          className={cn(
            "object-left object-contain max-w-none",
            inverse && "brightness-0 invert",
          )}
          priority
        />
      </div>
    </div>
  ) : (
    // Full Logo: clean and borderless, using brightness-0 invert on dark backgrounds
    <div
      className={cn(
        "inline-flex items-center shrink-0 cursor-pointer select-none transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Image
        src="/images/logo.png"
        alt="SunTech POS"
        width={currentSize.width}
        height={currentSize.height}
        className={cn(
          "object-contain",
          inverse && "brightness-0 invert",
        )}
        priority
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
