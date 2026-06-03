import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Loader2,
  Plus,
} from "lucide-react";

import { ProceduresGrid }
from "@/components/procedures/ProceduresGrid";

import { ProcedureFormModal }
from "@/components/procedures/ProcedureFormModal";

import {
  deleteProcedure,
  listProcedures,
} from "@/api/procedures";

export default function ProceduresPage() {

  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const data = await listProcedures();
      setProcedures(data);
    } catch (error) {
      console.error("Erro ao carregar procedimentos", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredProcedures = useMemo(() => {
    if (showInactive) {
      return procedures;
    }

    return procedures.filter(
      (item) => item.active
    );
  }, [procedures, showInactive]);

  function openCreateModal() {
    setEditingProcedure(null);
    setModalOpen(true);
  }

  function openEditModal(procedure) {
    setEditingProcedure(procedure);
    setModalOpen(true);
  }

  async function handleDelete(procedure) {
    const confirmed = window.confirm(
      `Excluir "${procedure.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProcedure(procedure.id);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Não foi possível excluir o procedimento."
      );
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto rounded-2xl bg-[#faf8f7] p-8">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-zinc-800">
            Procedimentos
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Catálogo de serviços da clínica
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) =>
                setShowInactive(e.target.checked)
              }
              className="h-4 w-4 rounded border-zinc-300 text-rose-600 focus:ring-rose-200"
            />
            Mostrar inativos
          </label>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-800"
          >
            <Plus size={16} />
            Novo Procedimento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-zinc-500">
          <Loader2
            size={24}
            className="animate-spin text-rose-600"
          />
          Carregando procedimentos...
        </div>
      ) : (
        <ProceduresGrid
          procedures={filteredProcedures}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      <ProcedureFormModal
        open={modalOpen}
        procedure={editingProcedure}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}
