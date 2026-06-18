"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import {
  TerreirosBrowse,
  TerreirosBrowseTerreiroFooter,
} from "@/components/terreiros/TerreirosBrowse";
import { mobileListCardClass } from "@/lib/terreiro-layout";
import { useTerreiros } from "@/hooks/useTerreiros";
import {
  getTerreiroReferencePoint,
  sortTerreiros,
  type ListSortOption,
} from "@/lib/sort-utils";

/** Terreiro logado mock — não listar a si mesmo na busca */
const MY_TERREIRO_ID = "1";

export default function TerreiroTerreirosPage() {
  const terreiros = useTerreiros();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ListSortOption | "">("");

  const filtered = useMemo(() => {
    const matched = terreiros.filter((t) => {
      if (t.id === MY_TERREIRO_ID) return false;
      const matchSearch =
        !search ||
        t.nome.toLowerCase().includes(search.toLowerCase()) ||
        t.cidade.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !category || t.categoria === category;
      return matchSearch && matchCategory;
    });

    return sortTerreiros(matched, sort, getTerreiroReferencePoint());
  }, [terreiros, search, category, sort]);

  const browseProps = {
    terreiros: filtered,
    search,
    onSearchChange: setSearch,
    category,
    onCategoryChange: setCategory,
    sort,
    onSortChange: setSort,
    detailBasePath: "/terreiro/terreiros" as const,
    footer: <TerreirosBrowseTerreiroFooter />,
  };

  return (
    <AppShell showNav accountType="terreiro" desktopInset>
      <Card title="Rede de Terreiros" className={mobileListCardClass}>
        <TerreirosBrowse {...browseProps} />
      </Card>

      <DesktopPanel
        title="Rede de Terreiros"
        subtitle="Busque casas parceiras para campanhas e ações conjuntas"
        surface="white"
        fillHeight
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <TerreirosBrowse {...browseProps} />
      </DesktopPanel>
    </AppShell>
  );
}
