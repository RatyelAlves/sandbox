"use client";

import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TerreirosMap } from "@/components/map/TerreirosMap";
import { FavoriteTerreiroButton } from "@/components/terreiros/FavoriteTerreiroButton";
import { TerreiroGirasList } from "@/components/terreiros/TerreiroGirasList";
import { TerreiroParticipacaoSection } from "@/components/terreiros/TerreiroParticipacaoSection";
import { TerreiroPhotoCarousel } from "@/components/terreiros/TerreiroPhotoCarousel";
import { TerreiroRelatedList } from "@/components/terreiros/TerreiroRelatedList";
import { useMemo } from "react";
import { useTerreiros } from "@/hooks/useTerreiros";
import type { Terreiro } from "@/lib/mock-data";
import {
  buildEmailUrl,
  buildFacebookUrl,
  buildInstagramUrl,
  buildSiteUrl,
  buildTelUrl,
  buildWhatsAppUrl,
  isExternalContactLink,
} from "@/lib/contact-links";

function InfoRow({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const external = href ? isExternalContactLink(href) : false;

  return (
    <p className="text-sm text-text-brown">
      <span className="font-semibold">{label}:</span>{" "}
      {href ? (
        <a
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-input-orange hover:underline"
        >
          {value}
        </a>
      ) : (
        value
      )}
    </p>
  );
}

interface TerreiroDetailViewProps {
  terreiro: Terreiro;
  accountType: "usuario" | "terreiro";
  /** Oculta o terreiro logado na lista de relacionados (ex.: id "1") */
  excludeRelatedId?: string;
}

export function TerreiroDetailView({
  terreiro,
  accountType,
  excludeRelatedId,
}: TerreiroDetailViewProps) {
  const terreiros = useTerreiros();
  const detailBase =
    accountType === "usuario" ? "/usuario/terreiros" : "/terreiro/terreiros";
  const backLabel =
    accountType === "usuario"
      ? "Voltar à busca de terreiros"
      : "Voltar à rede de terreiros";
  const related = useMemo(
    () =>
      terreiros
        .filter((t) => t.id !== terreiro.id && t.id !== excludeRelatedId)
        .slice(0, 3),
    [terreiros, terreiro.id, excludeRelatedId],
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col gap-3 pb-2 md:pb-0 lg:flex-row lg:items-stretch lg:gap-4 lg:overflow-hidden">
      <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden md:rounded-3xl md:bg-white md:px-6 md:py-6 md:shadow-[0_8px_32px_rgba(62,52,46,0.1)] md:ring-black/[0.06] lg:max-h-full lg:p-7">
        <header className="mb-3 grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2">
          <BackButton href={detailBase} label={backLabel} />
          <h1 className="text-center text-lg font-bold leading-tight text-text-brown md:text-xl">
            {terreiro.nome}
          </h1>
          {accountType === "usuario" ? (
            <FavoriteTerreiroButton terreiroId={terreiro.id} />
          ) : (
            <span aria-hidden className="h-10 w-10" />
          )}
        </header>

        {accountType === "terreiro" && (
          <div className="mb-3 shrink-0 rounded-2xl bg-input-orange/10 px-4 py-2 ring-1 ring-input-orange/20 md:py-2.5">
            <p className="mb-1.5 text-center text-sm text-text-brown/80 md:mb-2">
              Interessado em uma ação em conjunto com este terreiro?
            </p>
            <div className="flex justify-center">
              <Button
                href={`/terreiro/doacoes/nova?parceiro=${terreiro.id}`}
                fullWidth={false}
              >
                Propor campanha conjunta
              </Button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-0.5">
          <TerreiroPhotoCarousel
            fotos={terreiro.fotos}
            alt={terreiro.nome}
            density={accountType === "terreiro" ? "compact" : "comfortable"}
          />

          <div className="mt-3 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-start lg:gap-x-5">
              <section>
                <h2 className="mb-2 font-bold text-text-brown">Info Terreiro</h2>
                <div className="space-y-1">
                  <InfoRow label="Nome" value={terreiro.nome} />
                  <InfoRow
                    label="Data de Fundação"
                    value={terreiro.dataFundacao}
                  />
                  <InfoRow
                    label="Líder Religioso"
                    value={terreiro.liderReligioso}
                  />
                  <InfoRow label="Fundador" value={terreiro.fundador} />
                  <InfoRow
                    label="Nação do Fundador"
                    value={terreiro.nacaoFundador}
                  />
                </div>
              </section>

              <section id="contato-terreiro">
                <h2 className="mb-2 font-bold text-text-brown">
                  Horários, Contatos & Redes Sociais
                </h2>
                <div className="space-y-1">
                  {terreiro.giras && terreiro.giras.length > 0 ? (
                    <TerreiroGirasList giras={terreiro.giras} />
                  ) : (
                    <InfoRow
                      label="Horários"
                      value={`${terreiro.horarioAbertura} - ${terreiro.horarioFechamento}`}
                    />
                  )}
                  {terreiro.telefone.trim() && (
                    <InfoRow
                      label="Telefone"
                      value={terreiro.telefone}
                      href={buildTelUrl(terreiro.telefone)}
                    />
                  )}
                  {terreiro.email.trim() && (
                    <InfoRow
                      label="E-mail"
                      value={terreiro.email}
                      href={buildEmailUrl(terreiro.email)}
                    />
                  )}
                  {terreiro.site && (
                    <InfoRow
                      label="Site"
                      value={terreiro.site}
                      href={buildSiteUrl(terreiro.site)}
                    />
                  )}
                  {terreiro.instagram && (
                    <InfoRow
                      label="Instagram"
                      value={terreiro.instagram}
                      href={buildInstagramUrl(terreiro.instagram)}
                    />
                  )}
                  {terreiro.facebook && (
                    <InfoRow
                      label="Facebook"
                      value={terreiro.facebook}
                      href={buildFacebookUrl(terreiro.facebook)}
                    />
                  )}
                  {terreiro.whatsapp && (
                    <InfoRow
                      label="WhatsApp"
                      value={terreiro.whatsapp}
                      href={buildWhatsAppUrl(terreiro.whatsapp)}
                    />
                  )}
                </div>
              </section>

              <section>
                <h2 className="mb-2 font-bold text-text-brown">Localização</h2>
                <div className="space-y-1">
                  <InfoRow label="UF" value={terreiro.uf} />
                  <InfoRow label="Cidade" value={terreiro.cidade} />
                  <InfoRow label="Bairro" value={terreiro.bairro} />
                  <InfoRow
                    label="Rua"
                    value={`${terreiro.rua}, ${terreiro.numero}`}
                  />
                </div>
              </section>

              <aside className="w-full shrink-0 sm:col-span-2 sm:mx-auto sm:max-w-xs lg:col-span-1 lg:mx-0 lg:max-w-none lg:w-56 xl:w-64">
                <TerreirosMap
                  terreiros={[terreiro]}
                  height="100%"
                  fill
                  zoom={15}
                  showUserLocation={accountType === "usuario"}
                  distanceLabel="deste terreiro"
                  wrapperClassName="aspect-square w-full overflow-hidden rounded-xl"
                  className="h-full w-full rounded-xl border-2 md:border-[3px]"
                />
              </aside>
            </div>

            {accountType === "usuario" && (
              <TerreiroParticipacaoSection terreiroId={terreiro.id} />
            )}
          </div>
        </div>
      </Card>

      {related.length > 0 && (
        <TerreiroRelatedList terreiros={related} detailBase={detailBase} />
      )}
    </div>
  );
}
