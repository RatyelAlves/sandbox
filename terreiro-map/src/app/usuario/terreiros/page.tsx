"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import {
  TerreirosBrowse,
  TerreirosBrowseUsuarioFooter,
} from "@/components/terreiros/TerreirosBrowse";
import { mobileListCardClass } from "@/lib/terreiro-layout";
import { useTerreiros } from "@/hooks/useTerreiros";
import {
  getUsuarioReferencePoint,
  sortTerreiros,
  type ListSortOption,
} from "@/lib/sort-utils";

export default function UsuarioTerreirosPage() {
  const terreiros = useTerreiros();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ListSortOption | "">("");

  const filtered = useMemo(() => {
    const matched = terreiros.filter((t) => {
      const matchSearch =
        !search ||
        t.nome.toLowerCase().includes(search.toLowerCase()) ||
        t.cidade.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !category || t.categoria === category;
      return matchSearch && matchCategory;
    });

    return sortTerreiros(matched, sort, getUsuarioReferencePoint());
  }, [terreiros, search, category, sort]);

  const browseProps = {
    terreiros: filtered,
    search,
    onSearchChange: setSearch,
    category,
    onCategoryChange: setCategory,
    sort,
    onSortChange: setSort,
    detailBasePath: "/usuario/terreiros" as const,
    footer: <TerreirosBrowseUsuarioFooter />,
  };

  return (
    <AppShell showNav accountType="usuario" desktopInset>
      <Card title="Terreiros" className={mobileListCardClass}>
        <TerreirosBrowse {...browseProps} />
      </Card>

      <DesktopPanel
        title="Terreiros"
        subtitle="Busque casas de axé e tradições afro-brasileiras"
        surface="white"
        fillHeight
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <TerreirosBrowse {...browseProps} />
      </DesktopPanel>
    </AppShell>
  );
}
