"use client";

import { Button } from "@/components/ui/Button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  CAMPANHA_META_TIPO_LABEL,
  formatCampanhaDate,
} from "@/lib/campanha-utils";
import { useTerreiroById } from "@/hooks/useTerreiros";
import {
  formatPropostaMeta,
  PROPOSTA_STATUS_LABEL,
} from "@/lib/proposta-utils";
import {
  aceitarProposta,
  recusarProposta,
  type PropostaCampanha,
} from "@/lib/propostas-store";

interface PropostaCampanhaCardProps {
  proposta: PropostaCampanha;
  variant: "recebida" | "enviada";
}

export function PropostaCampanhaCard({
  proposta,
  variant,
}: PropostaCampanhaCardProps) {
  const { openConfirm, dialog } = useConfirmDialog();
  const terreiroId =
    variant === "recebida" ? proposta.deTerreiroId : proposta.paraTerreiroId;
  const terreiro = useTerreiroById(terreiroId);

  const isPendente = proposta.status === "pendente";

  function handleAceitar() {
    openConfirm({
      title: "Aceitar proposta?",
      message: (
        <>
          Aceitar a proposta{" "}
          <strong className="text-text-brown">{proposta.titulo}</strong>? Uma
          campanha conjunta será criada.
        </>
      ),
      confirmLabel: "Aceitar proposta",
      onConfirm: () => void aceitarProposta(proposta.id),
    });
  }

  function handleRecusar() {
    openConfirm({
      title: "Recusar proposta?",
      message: (
        <>
          Recusar a proposta{" "}
          <strong className="text-text-brown">{proposta.titulo}</strong>?
        </>
      ),
      confirmLabel: "Recusar",
      tone: "destructive",
      onConfirm: () => void recusarProposta(proposta.id),
    });
  }

  return (
    <>
      {dialog}
      <article className="rounded-xl bg-input-surface-warm/80 p-3 ring-1 ring-[color:var(--input-border)] sm:p-3.5">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
              isPendente
                ? "bg-input-orange/15 text-input-orange ring-input-orange/25"
                : proposta.status === "aceita"
                  ? "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20"
                  : "bg-text-brown/10 text-text-brown/60 ring-text-brown/15"
            }`}
          >
            {PROPOSTA_STATUS_LABEL[proposta.status]}
          </span>
          <span className="rounded-full bg-text-brown/8 px-2.5 py-0.5 text-xs font-semibold text-text-brown/70">
            {CAMPANHA_META_TIPO_LABEL[proposta.metaTipo]}
          </span>
        </div>
        <span className="text-xs text-text-brown/50">
          Até {formatCampanhaDate(proposta.dataFim)}
        </span>
      </div>

      <h2 className="mb-0.5 text-base font-bold leading-snug text-text-brown">
        {proposta.titulo}
      </h2>

      {terreiro && (
        <p className="mb-1 text-sm leading-snug text-text-brown/65">
          {variant === "recebida" ? "Proposta de" : "Enviada para"}{" "}
          <span className="font-semibold text-text-brown">{terreiro.nome}</span>
        </p>
      )}

      <p className="mb-2 text-sm leading-snug text-text-brown/80">
        {proposta.descricao}
      </p>

      <p className="mb-2 text-sm text-text-brown/70">{formatPropostaMeta(proposta)}</p>

      {variant === "recebida" && isPendente && (
        <div className="flex flex-wrap gap-2 border-t border-text-brown/10 pt-2">
          <Button
            type="button"
            fullWidth={false}
            onClick={handleAceitar}
            className="py-1.5 text-xs"
          >
            Aceitar proposta
          </Button>
          <Button
            type="button"
            variant="secondary"
            fullWidth={false}
            onClick={handleRecusar}
            className="py-1.5 text-xs"
          >
            Recusar
          </Button>
        </div>
      )}
      </article>
    </>
  );
}
