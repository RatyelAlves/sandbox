interface LogoMarkProps {
  size?: number;
  className?: string;
}

/** Emblema circular do TerreiroMap (sem texto, sem fundo). */
function LogoMark({ size = 96, className = "" }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="60" cy="60" r="56" fill="white" stroke="#1a1a1a" strokeWidth="5" />
      <path d="M60 18 A42 42 0 0 1 102 60 L60 60 Z" fill="#D9453B" />
      <path d="M18 60 A42 42 0 0 1 60 102 L60 60 Z" fill="#1E7D43" />
      <path d="M102 60 A42 42 0 0 1 60 102 L60 60 Z" fill="#F6C144" />
      <path
        d="M60 34 C50 34 44 42 44 52 C44 64 60 78 60 78 C60 78 76 64 76 52 C76 42 70 34 60 34 Z"
        fill="white"
        stroke="#1a1a1a"
        strokeWidth="2.5"
      />
      <circle cx="60" cy="50" r="5" fill="#1a1a1a" />
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
}

const sizes = { sm: 56, md: 88, lg: 104, xl: 136 };

export function Logo({ size = "md", showText = false }: LogoProps) {
  const px = sizes[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <LogoMark size={px} />
      {showText && (
        <div className="text-center leading-tight text-text-brown">
          <p className="text-base font-normal md:text-lg">Terreiro</p>
          <p className="text-xl font-bold tracking-wide md:text-2xl">MAP</p>
        </div>
      )}
    </div>
  );
}
