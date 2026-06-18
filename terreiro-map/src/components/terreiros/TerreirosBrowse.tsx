"use client";

import Link from "next/link";
import {
  ListBrowseFilters,
  ListItem,
} from "@/components/ui/ListItem";
import type { Terreiro } from "@/lib/mock-data";
import { TERREIRO_CATEGORIES } from "@/lib/constants";
import type { ListSortOption } from "@/lib/sort-utils";

interface TerreirosBrowseProps {
  terreiros: Terreiro[];
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  sort: ListSortOption | "";
  onSortChange: (value: ListSortOption | "") => void;
  detailBasePath: "/usuario/terreiros" | "/terreiro/terreiros";
  footer?: React.ReactNode;
}

export function TerreirosBrowse({
  terreiros,
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  detailBasePath,
  footer,
}: TerreirosBrowseProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ListBrowseFilters
        search={search}
        onSearchChange={onSearchChange}
        searchPlaceholder="Buscar terreiro ou cidade"
        category={category}
        onCategoryChange={onCategoryChange}
        categoryOptions={TERREIRO_CATEGORIES}
        sort={sort}
        onSortChange={onSortChange}
      />

      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain pr-0.5">
        {terreiros.map((t) => (
          <ListItem
            key={t.id}
            title={t.nome}
            subtitle={`${t.categoria} · ${t.cidade}, ${t.uf}`}
            href={`${detailBasePath}/${t.id}`}
          />
        ))}
        {footer}
      </div>
    </div>
  );
}

export function TerreirosBrowseUsuarioFooter() {
  return (
    <Link
      href="/usuario/sugestao"
      className="mt-4 shrink-0 text-center text-sm font-semibold text-text-brown underline"
    >
      Não achou o que procurava? Faça uma sugestão de cadastro
    </Link>
  );
}

export function TerreirosBrowseTerreiroFooter() {
  return (
    <p className="mt-4 shrink-0 text-center text-sm text-text-brown/70">
      Encontre terreiros parceiros para{" "}
      <span className="font-semibold text-text-brown">campanhas conjuntas</span> e
      ações comunitárias.
    </p>
  );
}
