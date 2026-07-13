import Image from "next/image";

// Brand mark — recolored to var(--ink) (#23241d) from the original grey
// asset (public/logo_transparent.png) to match the headline text colour.
export default function Logo({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/logo_ink.png"
      alt=""
      width={452}
      height={461}
      className={className}
      style={{ width: size, height: "auto" }}
      aria-hidden="true"
    />
  );
}
