import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

import { QuickReplyFormModal }
from "@/components/quickReplies/QuickReplyFormModal";

import {
  deleteQuickReply,
  listQuickReplies,
} from "@/api/quickReplies";

export default function QuickRepliesPage() {

  const [quickReplies, setQuickReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingReply, setEditingReply] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const data = await listQuickReplies();
      setQuickReplies(data);
    } catch (error) {
      console.error("Erro ao carregar respostas rápidas", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateModal() {
    setEditingReply(null);
    setModalOpen(true);
  }

  function openEditModal(reply) {
    setEditingReply(reply);
    setModalOpen(true);
  }

  async function handleDelete(reply) {
    const confirmed = window.confirm(
      `Excluir "${reply.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteQuickReply(reply.id);
      await loadData();
    } catch (error) {
      alert(
        error?.response?.data?.error ||
          "Não foi possível excluir."
      );
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto rounded-2xl bg-[#faf8f7] p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-zinc-800">
            Respostas Rápidas
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Mensagens prontas para usar no chat. No atendimento, clique no botão ⚡ ou digite / no campo de mensagem.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-rose-800"
        >
          <Plus size={16} />
          Nova resposta
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-zinc-500">
          <Loader2
            size={24}
            className="animate-spin text-rose-600"
          />
          Carregando...
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Título</th>
                <th className="px-4 py-3 font-medium">Atalho</th>
                <th className="px-4 py-3 font-medium">Mensagem</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>

            <tbody>
              {quickReplies.map((reply) => (
                <tr
                  key={reply.id}
                  className="border-t border-zinc-100"
                >
                  <td className="px-4 py-4 font-medium text-zinc-800">
                    {reply.title}
                  </td>

                  <td className="px-4 py-4 text-zinc-600">
                    {reply.shortcut
                      ? `/${reply.shortcut}`
                      : "—"}
                  </td>

                  <td className="max-w-md px-4 py-4 text-zinc-600">
                    <p className="line-clamp-2">
                      {reply.content}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        reply.active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {reply.active
                        ? "Ativa"
                        : "Inativa"}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          openEditModal(reply)
                        }
                        className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
                      >
                        <Pencil size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(reply)
                        }
                        className="rounded-lg border border-zinc-200 p-2 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <QuickReplyFormModal
        open={modalOpen}
        quickReply={editingReply}
        onClose={() => setModalOpen(false)}
        onSaved={loadData}
      />
    </div>
  );
}
