import {
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  X,
} from "lucide-react";

import {
  createProcedure,
  updateProcedure,
} from "@/api/procedures";

import {
  PROCEDURE_CATEGORIES,
} from "@/lib/procedureFormat";

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "Facial",
  price: "",
  durationMin: 60,
  active: true,
  sortOrder: 0,
};

export function ProcedureFormModal({
  open,
  procedure,
  onClose,
  onSaved,
}) {

  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = Boolean(procedure?.id);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");

    if (procedure) {
      setForm({
        name: procedure.name ?? "",
        description: procedure.description ?? "",
        category: procedure.category ?? "Facial",
        price: String(procedure.price ?? ""),
        durationMin: procedure.durationMin ?? 60,
        active: procedure.active ?? true,
        sortOrder: procedure.sortOrder ?? 0,
      });
      return;
    }

    setForm(EMPTY_FORM);
  }, [open, procedure]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      price: Number(form.price),
      durationMin: Number(form.durationMin),
      active: form.active,
      sortOrder: Number(form.sortOrder) || 0,
    };

    try {
      if (isEditing) {
        await updateProcedure(procedure.id, payload);
      } else {
        await createProcedure(payload);
      }

      onSaved?.();
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          "Não foi possível salvar o procedimento."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-zinc-800">
            {isEditing ? "Editar procedimento" : "Novo procedimento"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <label className="block space-y-1">
            <span className="text-sm font-medium text-zinc-700">Nome *</span>
            <input
              required
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              placeholder="Ex: Limpeza de pele"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-700">Categoria *</span>
              <select
                required
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              >
                {PROCEDURE_CATEGORIES.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-700">Ordem</span>
              <input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    sortOrder: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm font-medium text-zinc-700">Descrição</span>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              placeholder="Detalhes que a IA pode informar ao paciente"
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-700">Preço (R$) *</span>
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    price: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-zinc-700">Duração (min) *</span>
              <input
                required
                type="number"
                min="15"
                step="15"
                value={form.durationMin}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    durationMin: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              />
            </label>
          </div>

          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  active: e.target.checked,
                }))
              }
              className="h-4 w-4 rounded border-zinc-300 text-rose-500 focus:ring-rose-200"
            />
            <span className="text-sm text-zinc-700">Ativo para a IA</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-600 disabled:opacity-60"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
