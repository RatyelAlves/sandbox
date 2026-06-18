"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, DesktopPanel } from "@/components/ui/Card";
import {
  ListBrowseFilters,
  ListItem,
  Pagination,
} from "@/components/ui/ListItem";
import {
  EMPTY_FAVORITE_TERREIROS,
  getFavoriteTerreirosSnapshot,
  removeFavoriteTerreiro,
  subscribeToFavoritos,
} from "@/lib/favoritos-store";
import { TERREIRO_CATEGORIES, LIST_PAGE_SIZE } from "@/lib/constants";
import { mobileListCardClass } from "@/lib/terreiro-layout";
import {
  getUsuarioReferencePoint,
  sortTerreiros,
  type ListSortOption,
} from "@/lib/sort-utils";

function useFavoriteTerreiros() {
  return useSyncExternalStore(
    subscribeToFavoritos,
    getFavoriteTerreirosSnapshot,
    () => EMPTY_FAVORITE_TERREIROS,
  );
}

function FavoritosListContent({
  mobile = false,
  items,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPrevious,
  onNext,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  onRemove,
  emptyMessage,
}: {
  mobile?: boolean;
  items: ReturnType<typeof getFavoriteTerreirosSnapshot>;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: ListSortOption | "";
  onSortChange: (value: ListSortOption | "") => void;
  onRemove: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ListBrowseFilters
        category={category}
        onCategoryChange={onCategoryChange}
        categoryOptions={TERREIRO_CATEGORIES}
        categoryVariant={mobile ? "orange" : "default"}
        sort={sort}
        onSortChange={onSortChange}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {items.length > 0 ? (
          items.map((t) => (
            <ListItem
              key={t.id}
              title={t.nome}
              subtitle={`${t.categoria} · ${t.cidade}`}
              href={`/usuario/terreiros/${t.id}`}
              onRemove={() => onRemove(t.id)}
              removeLabel={`Remover ${t.nome} dos favoritos`}
            />
          ))
        ) : (
          <div className="flex flex-1 items-center justify-center py-8">
            <p className="text-center text-sm text-text-brown/55">{emptyMessage}</p>
          </div>
        )}
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

export default function UsuarioFavoritosPage() {
  const favoriteTerreiros = useFavoriteTerreiros();
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<ListSortOption | "">("");
  const [page, setPage] = useState(1);

  const favorites = useMemo(() => {
    const matched = favoriteTerreiros.filter(
      (t) => !category || t.categoria === category,
    );
    return sortTerreiros(matched, sort, getUsuarioReferencePoint());
  }, [favoriteTerreiros, category, sort]);

  const totalPages = Math.max(1, Math.ceil(favorites.length / LIST_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [category, sort]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginated = favorites.slice(
    (currentPage - 1) * LIST_PAGE_SIZE,
    currentPage * LIST_PAGE_SIZE,
  );

  const filterProps = {
    category,
    onCategoryChange: setCategory,
    sort,
    onSortChange: setSort,
    onRemove: removeFavoriteTerreiro,
    emptyMessage: "Nenhum terreiro favorito no momento.",
  };

  return (
    <AppShell showNav accountType="usuario" desktopInset>
      <Card title="Favoritos" className={mobileListCardClass}>
        <FavoritosListContent mobile items={favorites} {...filterProps} />
      </Card>

      <DesktopPanel
        title="Favoritos"
        subtitle="Terreiros salvos para acompanhar depois"
        surface="white"
        fillHeight
        className="md:h-[calc(100dvh-3rem)] md:max-h-none"
      >
        <FavoritosListContent
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
