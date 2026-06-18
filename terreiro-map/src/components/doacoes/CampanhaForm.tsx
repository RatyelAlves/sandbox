"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField, FormSection } from "@/components/ui/FormField";
import {
  FormActions,
  FormPageHeader,
  FormShell,
} from "@/components/ui/FormLayout";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input, TextArea } from "@/components/ui/Input";
import {
  addCampanhaFromForm,
  updateCampanhaFromForm,
  type CampanhaFormInput,
} from "@/lib/campanhas-store";
import { formatDateBR, formatDateISOToBR } from "@/lib/masks";
import { useTerreiros } from "@/hooks/useTerreiros";
import type { Campanha, CampanhaMetaTipo } from "@/lib/mock-data";
import { createPropostaCampanha } from "@/lib/propostas-store";

interface CampanhaFormProps {
  embedded?: boolean;
  mode: "create" | "edit";
  campanha?: Campanha;
  parceiroId?: string | null;
}

function campanhaToFormState(campanha: Campanha) {
  return {
    titulo: campanha.titulo,
    descricao: campanha.descricao,
    metaTipo: campanha.metaTipo,
    meta:
      campanha.metaTipo === "monetaria"
        ? String(campanha.metaArrecadacao)
        : String(campanha.metaQuantidade),
    arrecadado:
      campanha.metaTipo === "monetaria"
        ? String(campanha.valorArrecadado)
        : String(campanha.quantidadeArrecadada),
    itemDescricao: campanha.metaTipo === "itens" ? campanha.itemDescricao : "",
    unidade: campanha.metaTipo === "itens" ? campanha.unidade : "itens",
    dataFim: formatDateISOToBR(campanha.dataFim),
  };
}

export function CampanhaForm({
  embedded = false,
  mode,
  campanha,
  parceiroId,
}: CampanhaFormProps) {
  const router = useRouter();
  const terreiros = useTerreiros();
  const parceiro = parceiroId
    ? terreiros.find((t) => t.id === parceiroId)
    : campanha?.parceiroTerreiroId
      ? terreiros.find((t) => t.id === campanha.parceiroTerreiroId)
      : undefined;

  const initial = campanha ? campanhaToFormState(campanha) : null;

  const [titulo, setTitulo] = useState(
    () =>
      initial?.titulo ??
      (parceiro ? `Campanha conjunta — ${parceiro.nome}` : ""),
  );
  const [descricao, setDescricao] = useState(
    () =>
      initial?.descricao ??
      (parceiro
        ? `Proposta de campanha em parceria com ${parceiro.nome} (${parceiro.categoria}, ${parceiro.cidade}).`
        : ""),
  );
  const [metaTipo, setMetaTipo] = useState<CampanhaMetaTipo>(
    () => initial?.metaTipo ?? "monetaria",
  );
  const [meta, setMeta] = useState(() => initial?.meta ?? "");
  const [arrecadado, setArrecadado] = useState(
    () => initial?.arrecadado ?? "",
  );
  const [itemDescricao, setItemDescricao] = useState(
    () => initial?.itemDescricao ?? "",
  );
  const [unidade, setUnidade] = useState(() => initial?.unidade ?? "itens");
  const [dataFim, setDataFim] = useState(() => initial?.dataFim ?? "");

  const isEdit = mode === "edit";
  const title = isEdit
    ? "Editar campanha"
    : parceiro
      ? "Campanha conjunta"
      : "Nova campanha";
  const subtitle = isEdit
    ? "Atualize as informações da campanha"
    : parceiro
      ? "Proponha uma arrecadação em parceria com outro terreiro"
      : "Crie uma campanha para a comunidade";

  function buildFormInput(): CampanhaFormInput {
    const base = {
      titulo,
      descricao,
      metaTipo,
      dataFim,
    };

    if (metaTipo === "monetaria") {
      return {
        ...base,
        metaMonetaria: Number.parseFloat(meta.replace(/\./g, "").replace(",", ".")) || 0,
        ...(isEdit && {
          valorArrecadado:
            Number.parseFloat(arrecadado.replace(/\./g, "").replace(",", ".")) ||
            0,
        }),
      };
    }

    return {
      ...base,
      itemDescricao,
      metaQuantidade: Number.parseInt(meta.replace(/\D/g, ""), 10) || 0,
      unidade,
      ...(isEdit && {
        quantidadeArrecadada:
          Number.parseInt(arrecadado.replace(/\D/g, ""), 10) || 0,
      }),
    };
  }

  return (
    <FormShell
      onSubmit={(e) => {
        e.preventDefault();
        const input = buildFormInput();

        void (async () => {
          if (isEdit && campanha) {
            await updateCampanhaFromForm(campanha.id, input);
            router.push("/terreiro/doacoes");
            return;
          }

          if (parceiro) {
            await createPropostaCampanha(parceiro.id, input);
            router.push("/terreiro/doacoes?aba=propostas");
            return;
          }

          await addCampanhaFromForm(input);
          router.push("/terreiro/doacoes");
        })();
      }}
    >
      {!embedded && (
        <FormPageHeader
          title={title}
          subtitle={subtitle}
          backHref="/terreiro/doacoes"
        />
      )}

      {parceiro && (
        <div className="rounded-2xl bg-input-orange/10 px-4 py-3 text-sm text-text-brown ring-1 ring-input-orange/20">
          <span className="font-semibold">Parceiro:</span> {parceiro.nome} ·{" "}
          {parceiro.cidade}
        </div>
      )}

      <FormSection
        title="Detalhes da campanha"
        description="Título, objetivo e prazo de arrecadação."
      >
        <FormField label="Título" htmlFor="campanha-titulo">
          <Input
            id="campanha-titulo"
            placeholder="Ex.: Reforma do barracão"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Descrição e objetivo" htmlFor="campanha-descricao">
          <TextArea
            id="campanha-descricao"
            placeholder="Explique a finalidade da arrecadação"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            required
          />
        </FormField>
        <FormField label="Tipo de meta" htmlFor="campanha-meta-tipo">
          <CustomSelect
            value={metaTipo}
            onChange={(value) => setMetaTipo(value as CampanhaMetaTipo)}
            placeholder="Selecione o tipo de meta"
            options={[
              { value: "monetaria", label: "Recursos financeiros" },
              { value: "itens", label: "Alimentos, agasalhos ou outros itens" },
            ]}
            ariaLabel="Tipo de meta da campanha"
          />
        </FormField>
        {metaTipo === "monetaria" ? (
          <FormField label="Meta de arrecadação" htmlFor="campanha-meta" optional>
            <Input
              id="campanha-meta"
              placeholder="R$ 0,00"
              inputMode="decimal"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
            />
          </FormField>
        ) : (
          <>
            <FormField label="O que será arrecadado" htmlFor="campanha-itens">
              <Input
                id="campanha-itens"
                placeholder="Ex.: Alimentos não perecíveis, agasalhos, cobertores"
                value={itemDescricao}
                onChange={(e) => setItemDescricao(e.target.value)}
              />
            </FormField>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Meta (quantidade)" htmlFor="campanha-meta-qtd" optional>
                <Input
                  id="campanha-meta-qtd"
                  placeholder="Ex.: 500"
                  inputMode="numeric"
                  value={meta}
                  onChange={(e) => setMeta(e.target.value)}
                />
              </FormField>
              <FormField label="Unidade" htmlFor="campanha-unidade" optional>
                <Input
                  id="campanha-unidade"
                  placeholder="Ex.: kg, peças, cestas"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                />
              </FormField>
            </div>
          </>
        )}
        {isEdit && (
          <FormField
            label={
              metaTipo === "monetaria"
                ? "Valor já arrecadado"
                : "Quantidade já recebida"
            }
            htmlFor="campanha-arrecadado"
            optional
          >
            <Input
              id="campanha-arrecadado"
              placeholder={
                metaTipo === "monetaria"
                  ? "Ex.: 11850"
                  : `Ex.: 52 ${unidade || "itens"}`
              }
              inputMode={metaTipo === "monetaria" ? "decimal" : "numeric"}
              value={arrecadado}
              onChange={(e) => setArrecadado(e.target.value)}
            />
          </FormField>
        )}
        <FormField label="Data de encerramento" htmlFor="campanha-fim" optional>
          <Input
            id="campanha-fim"
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
            value={dataFim}
            onChange={(e) => setDataFim(formatDateBR(e.target.value))}
            maxLength={10}
          />
        </FormField>
      </FormSection>

      <FormActions
        submitLabel={
          isEdit
            ? "Salvar alterações"
            : parceiro
              ? "Enviar proposta"
              : "Criar campanha"
        }
        cancelHref="/terreiro/doacoes"
      />
    </FormShell>
  );
}
