import Link from "next/link";

export function BackBar({
  href,
  title,
  action,
}: {
  href: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <Link href={href} className="text-[15px] font-bold text-muted">
        ‹ Voltar
      </Link>
      <h1 className="text-[17px] font-bold">{title}</h1>
      <div className="min-w-14 text-right">{action}</div>
    </div>
  );
}
