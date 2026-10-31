"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, ImageOff, Package } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VariantImageCarouselProps {
  images?: Array<string | null | undefined> | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  autoPlayInterval?: number; // milliseconds, default 3000ms
  showControls?: boolean;
  showIndicators?: boolean;
}

export function VariantImageCarousel({
  images,
  alt = "Variant image",
  size = "md",
  className,
  autoPlayInterval = 3000,
  showControls = true,
  showIndicators = true,
}: VariantImageCarouselProps) {
  // Deduplicate and filter out empty / null URLs
  const cleanImages = useMemo(() => {
    if (!images || !Array.isArray(images)) return [];
    const set = new Set<string>();
    images.forEach((img) => {
      if (typeof img === "string" && img.trim().length > 0) {
        set.add(img.trim());
      }
    });
    return Array.from(set);
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const total = cleanImages.length;
  const activeSlide = total > 0 ? currentIndex % total : 0;

  const nextImage = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevImage = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-change image after 3 seconds (3000ms)
  useEffect(() => {
    if (total <= 1 || isHovered || autoPlayInterval <= 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, autoPlayInterval);
    return () => clearInterval(interval);
  }, [total, isHovered, autoPlayInterval]);

  // Handle single or no image scenarios
  if (total === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-slate-100 text-slate-400 select-none",
          size === "sm" ? "h-12 w-12" : size === "lg" ? "h-64 w-full" : "h-36 w-full",
          className,
        )}
        aria-label="No image available"
      >
        <Package className={cn(size === "sm" ? "h-5 w-5" : "h-8 w-8", "opacity-60")} />
      </div>
    );
  }

  const currentUrl = cleanImages[activeSlide] || cleanImages[0];
  const isCurrentFailed = failedImages[currentUrl];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg bg-slate-100 select-none",
        size === "sm" ? "h-12 w-12" : size === "lg" ? "h-64 w-full" : "h-36 w-full",
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Active Image */}
      {isCurrentFailed ? (
        <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
          <ImageOff className={cn(size === "sm" ? "h-4 w-4" : "h-6 w-6")} />
        </div>
      ) : (
        // Using standard img with error fallback for 100% reliable cross-domain Cloudinary loading
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentUrl}
          alt={`${alt} (${activeSlide + 1} of ${total})`}
          className="h-full w-full object-cover object-center transition-all duration-300"
          loading="lazy"
          onError={() => {
            setFailedImages((prev) => ({ ...prev, [currentUrl]: true }));
          }}
        />
      )}

      {/* Multiple Images Navigation Controls */}
      {total > 1 && showControls && (
        <>
          {/* Left Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevImage();
            }}
            className={cn(
              "absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-opacity cursor-pointer shadow-sm z-10",
              size === "sm"
                ? "h-4 w-4 opacity-0 group-hover:opacity-100"
                : "h-6 w-6 opacity-75 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            )}
            title="Previous image"
            aria-label="Previous image"
          >
            <ChevronLeft className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5")} />
          </button>

          {/* Right Chevron */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextImage();
            }}
            className={cn(
              "absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition-opacity cursor-pointer shadow-sm z-10",
              size === "sm"
                ? "h-4 w-4 opacity-0 group-hover:opacity-100"
                : "h-6 w-6 opacity-75 hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100",
            )}
            title="Next image"
            aria-label="Next image"
          >
            <ChevronRight className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5")} />
          </button>

          {/* Dots Indicator */}
          {showIndicators && size !== "sm" && (
            <div
              className="absolute bottom-1.5 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none"
              aria-hidden="true"
            >
              {cleanImages.map((_, idx) => (
                <span
                  key={idx}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    idx === activeSlide
                      ? "w-3 bg-white shadow-xs"
                      : "w-1.5 bg-white/50",
                  )}
                />
              ))}
            </div>
          )}

          {/* Image Count Badge */}
          {size !== "sm" && (
            <div className="absolute top-1.5 right-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-mono text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {activeSlide + 1}/{total}
            </div>
          )}
        </>
      )}
    </div>
  );
}
