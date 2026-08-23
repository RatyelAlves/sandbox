export function PhotoPrivacyBadge({ isPrivate }: { isPrivate: boolean }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
        isPrivate ? "bg-black/70 text-white" : "bg-accent text-accent-ink"
      }`}
    >
      {isPrivate ? "Privada" : "Pública"}
    </span>
  );
}

export function PhotoPrivacyButton({
  isPrivate,
  disabled,
  onToggle,
}: {
  isPrivate: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className="text-[10px] font-bold disabled:opacity-40"
    >
      {isPrivate ? "Tornar pública" : "Tornar privada"}
    </button>
  );
}
