import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("inline-flex items-center", className)}>
      <Image
        src="/bg/logo.png"
        alt="Bros"
        width={180}
        height={62}
        className="h-8 w-auto sm:h-9"
        priority
      />
    </Link>
  );
}
