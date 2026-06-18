const CREDITS_URL = "https://github.com/RatyelAlves";

interface ProjectCreditsProps {
  className?: string;
}

export function ProjectCredits({ className = "" }: ProjectCreditsProps) {
  return (
    <p
      className={`text-center text-[11px] leading-snug text-text-brown/45 ${className}`}
    >
      Desenvolvido por{" "}
      <a
        href={CREDITS_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-text-brown/65 underline decoration-text-brown/20 underline-offset-2 transition-colors hover:text-input-orange"
      >
        Ratyel Alves · C0tr4x
      </a>
    </p>
  );
}
