"use client";

import { Button } from "@/components/ui/Button";
import { useConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  CAMPANHA_META_TIPO_LABEL,
  CAMPANHA_STATUS_LABEL,
  formatCampanhaDate,
  getCampanhaMetaAtual,
  getCampanhaMetaTotal,
  getCampanhaParceiroLabel,
  getCampanhaProgress,
  getCampanhaProgressLabels,
} from "@/lib/campanha-utils";
import {
  encerrarCampanha,
  reativarCampanha,
} from "@/lib/campanhas-store";
import { useTerreiros } from "@/hooks/useTerreiros";
import type { Campanha } from "@/lib/mock-data";

interface CampanhaCardProps {
  campanha: Campanha;
  manage?: boolean;
}

export function CampanhaCard({ campanha, manage = true }: CampanhaCardProps) {
  const { openConfirm, dialog } = useConfirmDialog();
  const terreiros = useTerreiros();
  const progress = getCampanhaProgress(campanha);
  const parceiro = getCampanhaParceiroLabel(campanha, terreiros);
  const isConjunta = Boolean(campanha.parceiroTerreiroId);
  const progressLabels = getCampanhaProgressLabels(campanha);
  const isAtiva = campanha.status === "ativa";
  const isEncerrada = campanha.status === "encerrada";

  function handleEncerrar() {
    openConfirm({
      title: "Encerrar campanha?",
      message: (
        <>
          Encerrar a campanha{" "}
          <strong className="text-text-brown">{campanha.titulo}</strong>? Ela
          deixará de receber novas doações.
        </>
      ),
      confirmLabel: "Encerrar campanha",
      tone: "destructive",
      onConfirm: () => void encerrarCampanha(campanha.id),
    });
  }

  function handleReativar() {
    void reativarCampanha(campanha.id);
  }

  return (
    <>
      {dialog}
      <article
      className={`rounded-xl bg-input-surface-warm/80 p-3 ring-1 ring-[color:var(--input-border)] sm:p-3.5 ${
        isEncerrada ? "opacity-80" : ""
      }`}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-1.5">
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
              isAtiva
                ? "bg-input-orange/15 text-input-orange ring-input-orange/25"
                : "bg-text-brown/10 text-text-brown/60 ring-text-brown/15"
            }`}
          >
            {CAMPANHA_STATUS_LABEL[campanha.status]}
          </span>
          <span className="rounded-full bg-text-brown/8 px-2.5 py-0.5 text-xs font-semibold text-text-brown/70">
            {CAMPANHA_META_TIPO_LABEL[campanha.metaTipo]}
          </span>
          {isConjunta && (
            <span className="rounded-full bg-text-brown/8 px-2.5 py-0.5 text-xs font-semibold text-text-brown/70">
              Campanha conjunta
            </span>
          )}
        </div>
        <span className="text-xs text-text-brown/50">
          Até {formatCampanhaDate(campanha.dataFim)}
        </span>
      </div>

      <h2 className="mb-0.5 text-base font-bold leading-snug text-text-brown">
        {campanha.titulo}
      </h2>

      {parceiro && (
        <p className="mb-1 text-sm leading-snug text-text-brown/65">
          Em parceria com{" "}
          <span className="font-semibold text-text-brown">{parceiro}</span>
        </p>
      )}

      <p className="mb-2 text-sm leading-snug text-text-brown/80">
        {campanha.descricao}
      </p>

      {campanha.metaTipo === "itens" && (
        <p className="mb-1.5 text-sm leading-snug text-text-brown/70">
          <span className="font-semibold text-text-brown">Itens:</span>{" "}
          {campanha.itemDescricao}
        </p>
      )}

      <div className="mb-1.5 flex items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-brown/45">
            {progressLabels.atual}
          </p>
          <p className="text-lg font-bold leading-tight text-text-brown">
            {getCampanhaMetaAtual(campanha)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-text-brown/45">
            {progressLabels.meta}
          </p>
          <p className="text-sm font-semibold leading-tight text-text-brown/75">
            {getCampanhaMetaTotal(campanha)}
          </p>
        </div>
      </div>

      <div
        className="h-2 overflow-hidden rounded-full bg-input-peach/40"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progress}% da meta alcançada`}
      >
        <div
          className={`h-full rounded-full transition-all ${
            isEncerrada ? "bg-text-brown/35" : "bg-input-orange"
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p
        className={`mt-1 text-right text-[11px] font-semibold ${
          isEncerrada ? "text-text-brown/50" : "text-input-orange"
        }`}
      >
        {progress}% da meta
      </p>

      {(isAtiva || isEncerrada) && manage && (
        <div className="mt-2 flex flex-wrap gap-2 border-t border-text-brown/10 pt-2">
          <Button
            type="button"
            href={`/terreiro/doacoes/${campanha.id}/editar`}
            variant="secondary"
            fullWidth={false}
            className="py-1.5 text-xs"
          >
            Editar campanha
          </Button>

          {isAtiva && (
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={handleEncerrar}
              className="py-1.5 text-xs text-text-brown/80"
            >
              Encerrar campanha
            </Button>
          )}

          {isEncerrada && (
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={handleReativar}
              className="py-1.5 text-xs"
            >
              Reativar campanha
            </Button>
          )}
        </div>
      )}
      </article>
    </>
  );
}
