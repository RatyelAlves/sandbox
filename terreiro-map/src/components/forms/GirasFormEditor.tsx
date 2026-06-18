"use client";

import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Input } from "@/components/ui/Input";
import { DIAS_SEMANA } from "@/lib/constants";
import type { GiraHorario } from "@/lib/mock-data";
import { formatTimeHHMM } from "@/lib/masks";

const DIA_OPTIONS = DIAS_SEMANA.map((dia) => ({ value: dia, label: dia }));

function createEmptyGira(): GiraHorario {
  return {
    dia: DIAS_SEMANA[0],
    titulo: "",
    horarioInicio: "",
    horarioFim: "",
  };
}

interface GirasFormEditorProps {
  value: GiraHorario[];
  onChange: (giras: GiraHorario[]) => void;
}

export function GirasFormEditor({ value, onChange }: GirasFormEditorProps) {
  function updateGira(index: number, patch: Partial<GiraHorario>) {
    onChange(value.map((gira, i) => (i === index ? { ...gira, ...patch } : gira)));
  }

  function removeGira(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addGira() {
    onChange([...value, createEmptyGira()]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-sm text-text-brown/60">
          Nenhuma gira cadastrada. Use horário único abaixo ou adicione os dias e
          horários de cada trabalho.
        </p>
      )}

      {value.map((gira, index) => (
        <div
          key={`gira-${index}`}
          className="space-y-3 rounded-xl bg-input-surface-warm/50 p-3 ring-1 ring-[color:var(--input-border)] sm:p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-brown">
              Gira {index + 1}
            </p>
            <Button
              type="button"
              variant="secondary"
              fullWidth={false}
              onClick={() => removeGira(index)}
              className="py-1.5 text-xs"
            >
              Remover
            </Button>
          </div>

          <FormField label="Dia da semana" htmlFor={`gira-dia-${index}`}>
            <CustomSelect
              value={gira.dia}
              onChange={(dia) => updateGira(index, { dia })}
              options={DIA_OPTIONS}
              placeholder="Selecione o dia"
              ariaLabel={`Dia da gira ${index + 1}`}
            />
          </FormField>

          <FormField
            label="Tipo de gira"
            htmlFor={`gira-titulo-${index}`}
            optional
          >
            <Input
              id={`gira-titulo-${index}`}
              placeholder="Ex.: Gira de Caboclos"
              value={gira.titulo ?? ""}
              onChange={(e) => updateGira(index, { titulo: e.target.value })}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Início" htmlFor={`gira-inicio-${index}`}>
              <Input
                id={`gira-inicio-${index}`}
                placeholder="HH:MM"
                inputMode="numeric"
                value={gira.horarioInicio}
                onChange={(e) =>
                  updateGira(index, {
                    horarioInicio: formatTimeHHMM(e.target.value),
                  })
                }
                maxLength={5}
                required
              />
            </FormField>
            <FormField
              label="Término"
              htmlFor={`gira-fim-${index}`}
              optional
            >
              <Input
                id={`gira-fim-${index}`}
                placeholder="HH:MM"
                inputMode="numeric"
                value={gira.horarioFim ?? ""}
                onChange={(e) =>
                  updateGira(index, {
                    horarioFim: formatTimeHHMM(e.target.value),
                  })
                }
                maxLength={5}
              />
            </FormField>
          </div>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        fullWidth={false}
        onClick={addGira}
        className="text-sm"
      >
        + Adicionar gira
      </Button>
    </div>
  );
}
