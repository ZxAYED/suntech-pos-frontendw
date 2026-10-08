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
  // logo.png & logo-dark.png are 717x243 (aspect ratio ~2.95:1)
  const sizeMap = {
    sm: { width: 106, height: 36, iconSize: 32 },
    md: { width: 130, height: 44, iconSize: 38 },
    lg: { width: 160, height: 54, iconSize: 46 },
  };

  const currentSize = sizeMap[size];
  const logoSrc = inverse ? "/images/logo-dark.png" : "/images/logo.png";

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
          src={logoSrc}
          alt="SunTech Logo"
          width={currentSize.width}
          height={currentSize.height}
          className="object-left object-contain max-w-none"
          priority
        />
      </div>
    </div>
  ) : (
    // Full Logo: true brand colors (Electric Blue #0052FF preserved)
    <div
      className={cn(
        "inline-flex items-center shrink-0 cursor-pointer select-none transition-opacity hover:opacity-90",
        className,
      )}
    >
      <Image
        src={logoSrc}
        alt="SunTech POS"
        width={currentSize.width}
        height={currentSize.height}
        className="object-contain"
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
