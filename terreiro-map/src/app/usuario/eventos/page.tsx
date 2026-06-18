"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import {
  ListBrowseFilters,
  ListItem,
  Pagination,
} from "@/components/ui/ListItem";
import { useTerreiros } from "@/hooks/useTerreiros";
import { usePublicEventos } from "@/hooks/useEventos";
import { formatEventoSubtitle } from "@/lib/evento-utils";
import { EVENT_CATEGORIES, LIST_PAGE_SIZE } from "@/lib/constants";
import { mobileListCardClass } from "@/lib/terreiro-layout";
import {
  getUsuarioReferencePoint,
  sortEventos,
  type ListSortOption,
} from "@/lib/sort-utils";

function EventosListContent({
  mobile = false,
  items,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPrevious,
  onNext,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  terreiros,
}: {
  mobile?: boolean;
  items: ReturnType<typeof usePublicEventos>;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: ListSortOption | "";
  onSortChange: (value: ListSortOption | "") => void;
  terreiros: ReturnType<typeof useTerreiros>;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ListBrowseFilters
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar evento ou terreiro"
        category={category}
        onCategoryChange={onCategoryChange}
        categoryOptions={EVENT_CATEGORIES}
        categoryVariant={mobile ? "orange" : "default"}
        sort={sort}
        onSortChange={onSortChange}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
        {items.map((e) => {
          const terreiro = terreiros.find((t) => t.id === e.terreiroId);
          return (
            <ListItem
              key={e.id}
              title={e.titulo}
              subtitle={formatEventoSubtitle(e, terreiro?.nome)}
              href={`/usuario/eventos/${e.id}`}
            />
          );
        })}
      </div>

      {showPagination && items.length > 0 && totalPages > 1 && onPrevious && onNext && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPrevious={onPrevious}
          onNext={onNext}
        />
      )}
    </div>
  );
}

export default function UsuarioEventosPage() {
  const terreiros = useTerreiros();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ListSortOption | "">("");
  const [page, setPage] = useState(1);
  const publicEventos = usePublicEventos();

  const filtered = useMemo(() => {
    const matched = publicEventos.filter((e) => {
      const terreiro = terreiros.find((t) => t.id === e.terreiroId);
      const matchSearch =
        !search ||
        e.titulo.toLowerCase().includes(search.toLowerCase()) ||
        terreiro?.nome.toLowerCase().includes(search.toLowerCase());
      const matchCategory = !category || e.categoria === category;
      return matchSearch && matchCategory;
    });

    return sortEventos(matched, sort, getUsuarioReferencePoint());
  }, [search, category, sort, publicEventos, terreiros]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginated = filtered.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE,
  );

  const filterProps = {
    search,
    onSearchChange: setSearch,
    category,
    onCategoryChange: setCategory,
    sort,
    onSortChange: setSort,
    terreiros,
  };

  return (
    <AppShell showNav accountType="usuario" desktopInset>
      <Card title="Eventos" className={mobileListCardClass}>
        <EventosListContent mobile items={filtered} {...filterProps} />
      </Card>

      <DesktopPanel
        title="Eventos"
        subtitle="Giras, festividades e obrigações na região"
        surface="white"
        fillHeight
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <EventosListContent
          items={paginated}
          showPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPrevious={() => setPage((p) => Math.max(1, p - 1))}
          onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
          {...filterProps}
        />
      </DesktopPanel>
    </AppShell>
  );
}
