import {
  X,
} from "lucide-react";

export function QuickRepliesPanel({
  replies,
  filter = "",
  onSelect,
  onClose,
  disabled = false,
}) {

  const normalizedFilter =
    filter
      .replace(/^\//, "")
      .trim()
      .toLowerCase();

  const visibleReplies =
    replies.filter((reply) => {
      if (!normalizedFilter) {
        return true;
      }

      const title =
        reply.title.toLowerCase();

      const shortcut =
        reply.shortcut?.toLowerCase() ??
        "";

      return (
        title.includes(
          normalizedFilter
        ) ||
        shortcut.includes(
          normalizedFilter
        )
      );
    });

  if (!visibleReplies.length) {
    return (
      <div className="border-b border-zinc-100 bg-[#faf8f7] px-4 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">
            Respostas Rápidas
          </span>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-sm text-zinc-500">
          Nenhuma resposta encontrada para &quot;/{normalizedFilter}&quot;
        </p>
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-100 bg-[#faf8f7] px-4 py-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">
          Respostas Rápidas
        </span>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {visibleReplies.map((reply) => (
          <button
            key={reply.id}
            type="button"
            disabled={disabled}
            onClick={() =>
              onSelect(reply)
            }
            title={reply.content}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left text-sm text-zinc-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {reply.title}
          </button>
        ))}
      </div>
    </div>
  );
}
