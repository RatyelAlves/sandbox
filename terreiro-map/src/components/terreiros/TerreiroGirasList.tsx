import type { GiraHorario } from "@/lib/mock-data";
import {
  formatGiraHorario,
  formatGiraSubtitle,
  formatGiraTitulo,
} from "@/lib/gira-utils";

interface TerreiroGirasListProps {
  giras: GiraHorario[];
}

export function TerreiroGirasList({ giras }: TerreiroGirasListProps) {
  if (giras.length === 0) return null;

  return (
    <div className="mb-3">
      <h3 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-brown/45">
        Giras e horários
      </h3>
      <ul className="space-y-2">
        {giras.map((gira, index) => (
          <li
            key={`${gira.dia}-${gira.titulo ?? ""}-${gira.horarioInicio}-${index}`}
            className="rounded-lg bg-input-surface-warm/60 px-2.5 py-2 ring-1 ring-[color:var(--input-border)]"
          >
            <p className="text-sm font-semibold leading-snug text-text-brown">
              {formatGiraTitulo(gira)}
            </p>
            <p className="text-xs leading-snug text-text-brown/70">
              {gira.titulo ? formatGiraSubtitle(gira) : formatGiraHorario(gira)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
