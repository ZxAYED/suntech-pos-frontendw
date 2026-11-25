import type { ImgHTMLAttributes } from "react";
type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string }; fill?: boolean; priority?: boolean; quality?: number; unoptimized?: boolean;
};
export default function OfflineImage({ src, fill, priority, quality: _quality, unoptimized: _unoptimized, style, alt, ...props }: Props) {
  void _quality; void _unoptimized;
  // Product photos are optional; sale data never depends on an image cache.
  // eslint-disable-next-line @next/next/no-img-element
  return <img {...props} alt={alt || ""} src={typeof src === "string" ? src : src.src} loading={priority ? "eager" : "lazy"} style={{ ...(fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" } as const : {}), ...style }} />;
}
