"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CampanhaCard } from "@/components/doacoes/CampanhaCard";
import { PropostaCampanhaCard } from "@/components/doacoes/PropostaCampanhaCard";
import { useCampanhas } from "@/hooks/useCampanhas";
import { usePropostas } from "@/hooks/usePropostas";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Card, DesktopPanel } from "@/components/ui/Card";
import { mobileListCardClass } from "@/lib/terreiro-layout";

type FiltroCampanha = "ativas" | "encerradas" | "propostas";

function CampanhaFiltroTabs({
  filtro,
  onChange,
  totalAtivas,
  totalEncerradas,
  totalPropostasPendentes,
}: {
  filtro: FiltroCampanha;
  onChange: (filtro: FiltroCampanha) => void;
  totalAtivas: number;
  totalEncerradas: number;
  totalPropostasPendentes: number;
}) {
  const tabs: { id: FiltroCampanha; label: string; count: number }[] = [
    { id: "ativas", label: "Ativas", count: totalAtivas },
    { id: "encerradas", label: "Encerradas", count: totalEncerradas },
    { id: "propostas", label: "Propostas", count: totalPropostasPendentes },
  ];

  return (
    <div
      className="mb-3 flex shrink-0 rounded-xl bg-input-surface-warm/60 p-1 ring-1 ring-[color:var(--input-border)]"
      role="tablist"
      aria-label="Filtrar campanhas"
    >
      {tabs.map((tab) => {
        const selected = filtro === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all sm:px-3 sm:text-sm ${
              selected
                ? "bg-white text-text-brown shadow-sm"
                : "text-text-brown/55 hover:text-text-brown/80"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[11px] ${
                selected
                  ? "bg-input-orange/15 text-input-orange"
                  : "bg-text-brown/8 text-text-brown/45"
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function TerreiroDoacoesPage() {
  const searchParams = useSearchParams();
  const { ativas, encerradas } = useCampanhas();
  const { recebidas, enviadas, recebidasPendentes } = usePropostas();
  const [filtro, setFiltro] = useState<FiltroCampanha>("ativas");

  useEffect(() => {
    if (searchParams.get("aba") === "propostas") {
      setFiltro("propostas");
    }
  }, [searchParams]);

  const campanhasVisiveis = filtro === "ativas" ? ativas : encerradas;
  const nenhumaCampanha = ativas.length === 0 && encerradas.length === 0;
  const nenhumaProposta = recebidas.length === 0 && enviadas.length === 0;

  const content = (
    <>
      <Button type="button" href="/terreiro/doacoes/nova" className="mb-4 shrink-0 md:max-w-xs">
        Criar Nova Campanha
      </Button>

      <CampanhaFiltroTabs
        filtro={filtro}
        onChange={setFiltro}
        totalAtivas={ativas.length}
        totalEncerradas={encerradas.length}
        totalPropostasPendentes={recebidasPendentes.length}
      />

      {filtro === "propostas" ? (
        nenhumaProposta ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-sm text-text-brown/50">
              Nenhuma proposta de campanha conjunta no momento.
            </p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {recebidas.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-brown/45">
                  Recebidas
                </h2>
                <div className="space-y-2">
                  {recebidas.map((proposta) => (
                    <PropostaCampanhaCard
                      key={proposta.id}
                      proposta={proposta}
                      variant="recebida"
                    />
                  ))}
                </div>
              </section>
            )}

            {enviadas.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-text-brown/45">
                  Enviadas
                </h2>
                <div className="space-y-2">
                  {enviadas.map((proposta) => (
                    <PropostaCampanhaCard
                      key={proposta.id}
                      proposta={proposta}
                      variant="enviada"
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )
      ) : nenhumaCampanha ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-sm text-text-brown/50">
            Nenhuma campanha cadastrada no momento.
          </p>
        </div>
      ) : campanhasVisiveis.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-center text-sm text-text-brown/50">
            {filtro === "ativas"
              ? "Nenhuma campanha ativa no momento."
              : "Nenhuma campanha encerrada."}
          </p>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {campanhasVisiveis.map((campanha) => (
            <CampanhaCard key={campanha.id} campanha={campanha} />
          ))}
        </div>
      )}
    </>
  );

  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card title="Campanhas" className={mobileListCardClass}>
        {content}
      </Card>

      <DesktopPanel
        title="Campanhas"
        subtitle="Organize arrecadações e propostas em parceria"
        surface="white"
        fillHeight
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <div className="flex min-h-0 flex-1 flex-col">{content}</div>
      </DesktopPanel>
    </AppShell>
  );
}
