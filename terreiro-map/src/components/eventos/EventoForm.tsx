"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormField, FormSection } from "@/components/ui/FormField";
import {
  FormActions,
  FormPageHeader,
  FormShell,
} from "@/components/ui/FormLayout";
import { Input, TextArea } from "@/components/ui/Input";
import { CategorySelect } from "@/components/ui/ListItem";
import {
  addTerreiroEvento,
  updateEventoFromForm,
  type EventoFormInput,
} from "@/lib/eventos-store";
import { EVENT_CATEGORIES } from "@/lib/constants";
import {
  formatDateBR,
  formatDateISOToBR,
  formatTimeHHMM,
  parseDateBRToISO,
} from "@/lib/masks";
import type { Evento } from "@/lib/mock-data";
import { LOGGED_TERREIRO_ID } from "@/lib/mock-data";

interface EventoFormProps {
  embedded?: boolean;
  mode: "create" | "edit";
  evento?: Evento;
}

function eventoToFormState(evento: Evento) {
  return {
    titulo: evento.titulo,
    categoria: evento.categoria,
    data: formatDateISOToBR(evento.data),
    horario: evento.horario,
    local: evento.local,
    descricao: evento.descricao,
    linkIngresso: evento.linkIngresso ?? "",
  };
}

export function EventoForm({ embedded = false, mode, evento }: EventoFormProps) {
  const router = useRouter();
  const initial = evento ? eventoToFormState(evento) : null;
  const isEdit = mode === "edit";

  const [titulo, setTitulo] = useState(() => initial?.titulo ?? "");
  const [categoria, setCategoria] = useState(() => initial?.categoria ?? "");
  const [data, setData] = useState(() => initial?.data ?? "");
  const [horario, setHorario] = useState(() => initial?.horario ?? "");
  const [local, setLocal] = useState(() => initial?.local ?? "");
  const [descricao, setDescricao] = useState(() => initial?.descricao ?? "");
  const [linkIngresso, setLinkIngresso] = useState(
    () => initial?.linkIngresso ?? "",
  );

  function buildInput(): EventoFormInput {
    const ingresso = linkIngresso.trim();
    return {
      titulo,
      categoria,
      data: parseDateBRToISO(data),
      horario,
      local,
      descricao,
      ...(ingresso ? { linkIngresso: ingresso } : {}),
    };
  }

  return (
    <FormShell
      onSubmit={(e) => {
        e.preventDefault();
        void (async () => {
          if (isEdit && evento) {
            await updateEventoFromForm(evento.id, buildInput());
          } else {
            await addTerreiroEvento({
              terreiroId: LOGGED_TERREIRO_ID,
              ...buildInput(),
            });
          }
          router.push("/terreiro/eventos");
        })();
      }}
    >
      {!embedded && (
        <FormPageHeader
          title={isEdit ? "Editar evento" : "Cadastrar Novo Evento"}
          subtitle={
            isEdit
              ? "Atualize as informações do evento"
              : "Divulgue giras, festividades e obrigações"
          }
          backHref="/terreiro/eventos"
        />
      )}

      <FormSection
        title="Informações básicas"
        description="Nome, tipo e descrição do evento."
      >
        <FormField label="Título do evento" htmlFor="evento-titulo">
          <Input
            id="evento-titulo"
            placeholder="Ex.: Gira de Caboclos"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Categoria" htmlFor="evento-categoria">
          <CategorySelect
            value={categoria}
            onChange={setCategoria}
            options={EVENT_CATEGORIES}
            label="Selecione a categoria"
          />
        </FormField>
        <FormField label="Descrição" htmlFor="evento-descricao">
          <TextArea
            id="evento-descricao"
            placeholder="Descreva o evento, público-alvo e informações importantes."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={4}
            required
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Data, horário e local"
        description="Quando e onde o evento acontece."
      >
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <FormField label="Data" htmlFor="evento-data">
            <Input
              id="evento-data"
              placeholder="DD/MM/AAAA"
              inputMode="numeric"
              value={data}
              onChange={(e) => setData(formatDateBR(e.target.value))}
              maxLength={10}
              required
            />
          </FormField>
          <FormField label="Horário" htmlFor="evento-horario">
            <Input
              id="evento-horario"
              placeholder="HH:MM"
              inputMode="numeric"
              value={horario}
              onChange={(e) => setHorario(formatTimeHHMM(e.target.value))}
              maxLength={5}
              required
            />
          </FormField>
        </div>
        <FormField label="Local" htmlFor="evento-local">
          <Input
            id="evento-local"
            placeholder="Endereço ou referência do local"
            value={local}
            onChange={(e) => setLocal(e.target.value)}
            required
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Ingressos"
        description="Inclua apenas se houver venda ou reserva online."
      >
        <FormField
          label="Link para compra de ingresso"
          htmlFor="evento-ingresso"
          optional
          hint="Cole a URL da plataforma de ingressos ou página de inscrição."
        >
          <Input
            id="evento-ingresso"
            type="url"
            placeholder="https://"
            value={linkIngresso}
            onChange={(e) => setLinkIngresso(e.target.value)}
          />
        </FormField>
      </FormSection>

      <FormActions
        submitLabel={isEdit ? "Salvar alterações" : "Publicar evento"}
        cancelHref="/terreiro/eventos"
      />
    </FormShell>
  );
}
