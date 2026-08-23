"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BackBar } from "@/components/back-bar";
import { Alert, buttonClass } from "@/components/ui";
import { unblockUser } from "@/lib/blocks";
import { createClient } from "@/lib/supabase/client";

type BlockedProfile = {
  id: string;
  alias: string;
  city: string;
};

export default function BloqueadosPage() {
  const [items, setItems] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: rows } = await supabase
      .from("blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id)
      .order("created_at", { ascending: false });

    const ids = (rows ?? []).map((row) => row.blocked_id);
    if (!ids.length) {
      setItems([]);
      setLoading(false);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, alias, city")
      .in("id", ids);

    const map = new Map(
      ((profiles ?? []) as Array<{ id: string; alias: string; city: string }>).map(
        (profile) => [profile.id, profile],
      ),
    );

    setItems(
      ids.map((id) => {
        const profile = map.get(id);
        return {
          id,
          alias: profile?.alias ?? "Usuário",
          city: profile?.city ?? "",
        };
      }),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function undo(id: string) {
    setBusyId(id);
    setError("");
    const result = await unblockUser(id);
    setBusyId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <BackBar href="/conta" title="Bloqueados" />
      {error ? (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      ) : null}

      {loading ? (
        <p className="px-1 text-[13px] text-muted">Carregando…</p>
      ) : items.length === 0 ? (
        <p className="px-1 py-6 text-[13px] text-muted">
          Ninguém bloqueado. Quem você bloquear aparece aqui para desbloquear.
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 border-b border-line px-1 py-3"
            >
              <Link href={`/u/${item.id}`} className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-bold">{item.alias}</p>
                {item.city ? (
                  <p className="truncate text-[13px] text-muted">{item.city}</p>
                ) : null}
              </Link>
              <button
                type="button"
                disabled={busyId === item.id}
                onClick={() => undo(item.id)}
                className={buttonClass.secondary + " !px-4 !py-2 text-[13px]"}
              >
                {busyId === item.id ? "…" : "Desbloquear"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
