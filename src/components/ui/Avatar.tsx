import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = { sm: 32, md: 40, lg: 56, xl: 80 };

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  const px = sizes[size];
  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden bg-forest-700 flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: px, height: px }}
    >
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <span className="text-forest-100 font-bold" style={{ fontSize: px * 0.35 }}>
          {initials}
        </span>
      )}
    </div>
  );
}
