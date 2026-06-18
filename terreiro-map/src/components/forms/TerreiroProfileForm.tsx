"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormField, FormSection } from "@/components/ui/FormField";
import {
  FormActions,
  FormPageHeader,
  FormShell,
} from "@/components/ui/FormLayout";
import { Input, TextArea } from "@/components/ui/Input";
import { ProfilePhotoUpload } from "@/components/ui/ProfilePhotoUpload";
import {
  createGallerySlots,
  GalleryPhotoUpload,
} from "@/components/ui/GalleryPhotoUpload";
import { GirasFormEditor } from "@/components/forms/GirasFormEditor";
import { useAlertDialog } from "@/components/ui/AlertDialog";
import { useAuth } from "@/lib/auth-context";
import { cepDigits, fetchAddressByCep, formatCep } from "@/lib/cep";
import { formatDateBR, formatTimeHHMM } from "@/lib/masks";
import type { GiraHorario } from "@/lib/mock-data";
import { LOGGED_TERREIRO_ID, type Terreiro } from "@/lib/mock-data";
import { useTerreiroById } from "@/hooks/useTerreiros";
import {
  getLoggedTerreiroProfile,
  normalizeGiras,
  saveTerreiroProfile,
} from "@/lib/terreiro-profile-store";

const OPTIONAL_FIELDS = ["Site", "Instagram", "Facebook", "Whatsapp"] as const;

function formatFoundationDate(value: string): string {
  if (/^\d{4}$/.test(value)) return `01/01/${value}`;
  return value;
}

interface TerreiroProfileFormProps {
  mode: "register" | "update" | "suggestion";
  embedded?: boolean;
  backHref?: string;
  cancelHref?: string;
}

export function TerreiroProfileForm({
  mode,
  embedded = false,
  backHref,
  cancelHref,
}: TerreiroProfileFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const { openAlert, dialog } = useAlertDialog();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loggedTerreiro = useTerreiroById(LOGGED_TERREIRO_ID);

  const profileInitial = useMemo(
    () => (mode === "update" ? getLoggedTerreiroProfile() : null),
    [mode],
  );

  const initial = useMemo(
    () => (mode === "update" ? loggedTerreiro : null),
    [mode, loggedTerreiro],
  );

  const [cep, setCep] = useState("");
  const [uf, setUf] = useState(initial?.uf ?? "");
  const [cidade, setCidade] = useState(initial?.cidade ?? "");
  const [bairro, setBairro] = useState(initial?.bairro ?? "");
  const [fotos, setFotos] = useState<(string | null)[]>(() =>
    createGallerySlots(initial?.fotos ?? []),
  );
  const [rua, setRua] = useState(initial?.rua ?? "");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");
  const [dataFundacao, setDataFundacao] = useState(
    initial ? formatFoundationDate(initial.dataFundacao) : "",
  );
  const [horarioAbertura, setHorarioAbertura] = useState(
    profileInitial?.horarioAbertura ?? initial?.horarioAbertura ?? "",
  );
  const [horarioFechamento, setHorarioFechamento] = useState(
    profileInitial?.horarioFechamento ?? initial?.horarioFechamento ?? "",
  );
  const [giras, setGiras] = useState<GiraHorario[]>(
    () => profileInitial?.giras ?? initial?.giras ?? [],
  );

  const usesGiraSchedule = giras.some((gira) => gira.horarioInicio.trim());

  const socialOptional = mode === "register" || mode === "update";
  const showPasswordFields = mode === "register";
  const showTermsCheckbox = mode === "register" || mode === "suggestion";

  const handleCepChange = useCallback(async (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
    setCepError("");

    const digits = cepDigits(formatted);
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const address = await fetchAddressByCep(formatted);
      if (!address) {
        setCepError("CEP não encontrado");
        return;
      }
      setUf(address.uf);
      setCidade(address.cidade);
      setBairro(address.bairro);
      setRua(address.rua);
    } catch {
      setCepError("Não foi possível buscar o CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError("");

    const normalizedGiras = normalizeGiras(giras);
    const hasGiras = normalizedGiras.length > 0;

    if (!hasGiras && (!horarioAbertura.trim() || !horarioFechamento.trim())) {
      openAlert({
        title: "Horários incompletos",
        message:
          "Informe o horário de abertura e fechamento ou cadastre ao menos uma gira.",
      });
      return;
    }

    if (mode === "register") {
      const form = new FormData(e.currentTarget);
      const email = String(form.get("email") ?? "").trim();
      const password = String(form.get("password") ?? "");
      const confirmPassword = String(form.get("confirmPassword") ?? "");

      if (password !== confirmPassword) {
        setFormError("As senhas não coincidem.");
        return;
      }

      setSubmitting(true);
      try {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password,
            accountType: "terreiro",
            terreiroId: LOGGED_TERREIRO_ID,
          }),
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          setFormError(payload.error ?? "Não foi possível criar a conta.");
          return;
        }

        const signIn = await login(email, password);
        if (!signIn.ok) {
          setFormError(signIn.error ?? "Conta criada, mas falha ao entrar.");
          return;
        }

        router.push("/terreiro/home");
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === "update") {
      void saveTerreiroProfile({
        giras: normalizedGiras,
        horarioAbertura: horarioAbertura.trim(),
        horarioFechamento: horarioFechamento.trim(),
      }).then(() => {
        router.push("/terreiro/perfil");
      });
      return;
    }

    if (mode === "suggestion") {
      router.push("/usuario/terreiros");
    }
  };

  const titles = {
    register: "Monte seu perfil de Terreiro",
    update: "Atualize seu perfil",
    suggestion: "Sugestão de cadastro",
  };

  const subtitles = {
    register: "Cadastre sua casa no mapa da comunidade",
    update: "Mantenha as informações do seu terreiro atualizadas",
    suggestion: "Sua sugestão será avaliada em até 3 dias úteis",
  };

  const submitLabels = {
    register: "Cadastrar",
    update: "Atualizar",
    suggestion: "Enviar para validação",
  };

  const resolvedBackHref =
    backHref ??
    (mode === "register"
      ? "/primeiro-acesso"
      : mode === "suggestion"
        ? "/usuario/terreiros"
        : undefined);
  const resolvedCancelHref =
    cancelHref ??
    (mode === "register"
      ? "/primeiro-acesso"
      : mode === "suggestion"
        ? "/usuario/terreiros"
        : "/terreiro/home");

  const getOptionalDefault = (field: (typeof OPTIONAL_FIELDS)[number]) => {
    if (!initial) return undefined;
    const key = field.toLowerCase() as keyof Terreiro;
    return initial[key] ? String(initial[key]) : undefined;
  };

  return (
    <>
    {dialog}
    <FormShell onSubmit={handleSubmit}>
      {!embedded && (
        <FormPageHeader
          title={titles[mode]}
          subtitle={subtitles[mode]}
          backHref={resolvedBackHref}
        />
      )}

      <FormSection
        title="Identidade do terreiro"
        description="Nome, tradição e história da casa."
      >
        <ProfilePhotoUpload />
        <FormField label="Nome" htmlFor="terreiro-nome">
          <Input
            id="terreiro-nome"
            placeholder="Nome do terreiro"
            defaultValue={initial?.nome}
            required
          />
        </FormField>
        <FormField label="Categoria" htmlFor="terreiro-categoria">
          <Input
            id="terreiro-categoria"
            placeholder="Ex.: Umbanda, Candomblé Ketu"
            defaultValue={initial?.categoria}
            required
          />
        </FormField>
        <FormField label="Descrição" htmlFor="terreiro-descricao">
          <TextArea
            id="terreiro-descricao"
            placeholder="Conte a história e o trabalho espiritual do terreiro"
            defaultValue={initial?.descricao}
            rows={4}
            required
          />
        </FormField>
        <FormField label="Data de fundação" htmlFor="terreiro-fundacao">
          <Input
            id="terreiro-fundacao"
            placeholder="DD/MM/AAAA"
            inputMode="numeric"
            autoComplete="bday"
            value={dataFundacao}
            onChange={(e) => setDataFundacao(formatDateBR(e.target.value))}
            maxLength={10}
            required
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Dirigência e tradição"
        description="Responsáveis e linha de origem da casa."
      >
        <FormField label="Dirigente religioso" htmlFor="terreiro-dirigente">
          <Input
            id="terreiro-dirigente"
            placeholder="Nome do dirigente"
            defaultValue={initial?.liderReligioso}
            required
          />
        </FormField>
        <FormField label="Fundador" htmlFor="terreiro-fundador">
          <Input
            id="terreiro-fundador"
            placeholder="Nome do fundador"
            defaultValue={initial?.fundador}
            required
          />
        </FormField>
        <FormField label="Nação do fundador" htmlFor="terreiro-nacao">
          <Input
            id="terreiro-nacao"
            placeholder="Ex.: Ketu, Angola, Jeje"
            defaultValue={initial?.nacaoFundador}
            required
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Endereço"
        description="Localização para exibição no mapa."
      >
        <FormField label="CEP" htmlFor="terreiro-cep">
          <Input
            id="terreiro-cep"
            placeholder="00000-000"
            inputMode="numeric"
            autoComplete="postal-code"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            required
          />
          {cepLoading && (
            <p className="text-xs text-text-brown/60">Buscando endereço...</p>
          )}
          {cepError && <p className="text-xs text-red-600">{cepError}</p>}
        </FormField>
        <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
          <FormField label="UF" htmlFor="terreiro-uf">
            <Input
              id="terreiro-uf"
              placeholder="MG"
              value={uf}
              onChange={(e) => setUf(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Cidade" htmlFor="terreiro-cidade">
            <Input
              id="terreiro-cidade"
              placeholder="Cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              required
            />
          </FormField>
        </div>
        <FormField label="Bairro" htmlFor="terreiro-bairro">
          <Input
            id="terreiro-bairro"
            placeholder="Bairro"
            value={bairro}
            onChange={(e) => setBairro(e.target.value)}
            required
          />
        </FormField>
        <FormField label="Rua" htmlFor="terreiro-rua">
          <Input
            id="terreiro-rua"
            placeholder="Logradouro"
            value={rua}
            onChange={(e) => setRua(e.target.value)}
            required
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Número" htmlFor="terreiro-numero">
            <Input
              id="terreiro-numero"
              placeholder="Nº"
              defaultValue={initial?.numero}
              required
            />
          </FormField>
          <FormField label="Complemento" htmlFor="terreiro-complemento" optional>
            <Input id="terreiro-complemento" placeholder="Sala, bloco, referência" />
          </FormField>
        </div>
      </FormSection>

      <FormSection
        title="Giras e horários"
        description="Cadastre cada dia e horário de trabalho. Se preferir, use apenas o horário único abaixo."
      >
        <GirasFormEditor value={giras} onChange={setGiras} />
      </FormSection>

      <FormSection
        title="Horário único"
        description={
          usesGiraSchedule
            ? "Opcional quando há giras cadastradas. Pode servir como referência geral."
            : "Use quando o terreiro funciona no mesmo horário todos os dias."
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Abertura" htmlFor="terreiro-abertura" optional={usesGiraSchedule}>
            <Input
              id="terreiro-abertura"
              placeholder="HH:MM"
              inputMode="numeric"
              value={horarioAbertura}
              onChange={(e) => setHorarioAbertura(formatTimeHHMM(e.target.value))}
              maxLength={5}
              required={!usesGiraSchedule}
            />
          </FormField>
          <FormField
            label="Fechamento"
            htmlFor="terreiro-fechamento"
            optional={usesGiraSchedule}
          >
            <Input
              id="terreiro-fechamento"
              placeholder="HH:MM"
              inputMode="numeric"
              value={horarioFechamento}
              onChange={(e) => setHorarioFechamento(formatTimeHHMM(e.target.value))}
              maxLength={5}
              required={!usesGiraSchedule}
            />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Contato" description="Canais oficiais do terreiro.">
        <FormField label="Telefone" htmlFor="terreiro-telefone">
          <Input
            id="terreiro-telefone"
            placeholder="(31) 99999-9999"
            type="tel"
            defaultValue={initial?.telefone}
            required
          />
        </FormField>
        <FormField label="E-mail" htmlFor="terreiro-email">
          <Input
            id="terreiro-email"
            name="email"
            placeholder="contato@terreiro.com"
            type="email"
            defaultValue={initial?.email}
            autoComplete="email"
            required
          />
        </FormField>
      </FormSection>

      <FormSection
        title="Redes sociais"
        description="Links para site e perfis nas redes."
      >
        {OPTIONAL_FIELDS.map((field) => (
          <FormField
            key={field}
            label={field}
            htmlFor={`terreiro-${field.toLowerCase()}`}
            optional={socialOptional}
          >
            <Input
              id={`terreiro-${field.toLowerCase()}`}
              placeholder={
                field === "Site" ? "https://" : field === "Whatsapp" ? "(31) 99999-9999" : "@usuario"
              }
              defaultValue={getOptionalDefault(field)}
              required={!socialOptional}
            />
          </FormField>
        ))}
      </FormSection>

      {showPasswordFields && (
        <FormSection title="Segurança" description="Senha de acesso ao painel do terreiro.">
          <FormField label="Senha" htmlFor="terreiro-senha">
            <Input
              id="terreiro-senha"
              name="password"
              placeholder="Mínimo 6 caracteres"
              type="password"
              variant="peach"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </FormField>
          <FormField label="Confirmar senha" htmlFor="terreiro-confirmar-senha">
            <Input
              id="terreiro-confirmar-senha"
              name="confirmPassword"
              placeholder="Repita a senha"
              type="password"
              variant="peach"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </FormField>
        </FormSection>
      )}

      {mode === "suggestion" && (
        <FormSection
          title="Acompanhamento"
          description="Informe seu e-mail para receber o resultado da validação."
        >
          <FormField label="Seu e-mail" htmlFor="sugestao-email">
            <Input
              id="sugestao-email"
              placeholder="seu@email.com"
              type="email"
              required
            />
          </FormField>
        </FormSection>
      )}

      <FormSection
        title="Fotos"
        description={
          mode === "suggestion"
            ? "Adicione imagens que ajudem na validação."
            : "Mostre o espaço e momentos do terreiro."
        }
      >
        <GalleryPhotoUpload value={fotos} onChange={setFotos} maxPhotos={3} />
      </FormSection>

      {showTermsCheckbox && (
        <label className="flex items-start gap-2 text-sm text-text-brown/80">
          <input type="checkbox" required className="mt-1" />
          <span>
            Declaro que todas as informações fornecidas são verídicas e de minha
            total responsabilidade.
          </span>
        </label>
      )}

      {formError && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700 ring-1 ring-red-200">
          {formError}
        </p>
      )}

      <FormActions
        submitLabel={mode === "register" && submitting ? "Cadastrando..." : submitLabels[mode]}
        cancelHref={mode === "update" ? undefined : resolvedCancelHref}
      />
    </FormShell>
    </>
  );
}
