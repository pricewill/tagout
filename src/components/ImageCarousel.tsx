"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselImage {
  url: string;
  alt?: string;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  className?: string;
  aspectRatio?: "square" | "video" | "portrait";
}

export function ImageCarousel({
  images,
  className,
  aspectRatio = "square",
}: ImageCarouselProps) {
  const [current, setCurrent] = useState(0);

  if (!images.length) {
    return (
      <div
        className={cn(
          "bg-slate-800 flex items-center justify-center",
          aspectRatio === "square" && "aspect-square",
          aspectRatio === "video" && "aspect-video",
          aspectRatio === "portrait" && "aspect-[3/4]",
          className
        )}
      >
        <span className="text-slate-500 text-sm">No image</span>
      </div>
    );
  }

  const prev = () => setCurrent((c) => (c - 1 + images.length) % images.length);
  const next = () => setCurrent((c) => (c + 1) % images.length);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-slate-900 group",
        aspectRatio === "square" && "aspect-square",
        aspectRatio === "video" && "aspect-video",
        aspectRatio === "portrait" && "aspect-[3/4]",
        className
      )}
    >
      {images.map((img, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 transition-opacity duration-300",
            i === current ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <Image
            src={img.url}
            alt={img.alt ?? `Photo ${i + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={i === 0}
          />
        </div>
      ))}

      {images.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all",
                  i === current ? "bg-white w-3" : "bg-white/50"
                )}
                aria-label={`Go to image ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
