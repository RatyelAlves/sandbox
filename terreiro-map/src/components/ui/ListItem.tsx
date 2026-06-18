"use client";

import Image from "next/image";
import Link from "next/link";
import { CustomSelect } from "@/components/ui/CustomSelect";
import {
  LIST_SORT_OPTIONS,
  type ListSortOption,
} from "@/lib/sort-utils";

interface ListItemProps {
  title?: string;
  subtitle?: string;
  href?: string;
  onRemove?: () => void;
  removeLabel?: string;
}

export function ListItem({
  title,
  subtitle,
  href,
  onRemove,
  removeLabel = "Remover dos favoritos",
}: ListItemProps) {
  const mainContent = (
    <>
      <div className="h-14 w-14 shrink-0 rounded-lg bg-input-peach/60" />
      <div className="min-w-0 flex-1">
        {title ? (
          <>
            <p className="truncate font-semibold text-text-brown">{title}</p>
            {subtitle && (
              <p className="truncate text-sm text-text-brown/70">{subtitle}</p>
            )}
          </>
        ) : (
          <div className="h-4 w-3/4 rounded bg-input-peach/50" />
        )}
      </div>
    </>
  );

  return (
    <div className="flex items-center gap-3 rounded-xl bg-input-surface-warm/80 p-3 ring-1 ring-[color:var(--input-border)]">
      {href ? (
        <Link
          href={href}
          className="flex min-w-0 flex-1 items-center gap-3 transition-opacity hover:opacity-80"
        >
          {mainContent}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-center gap-3">{mainContent}</div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-input-orange text-lg font-bold leading-none text-white shadow-sm shadow-input-orange/20 transition-all hover:bg-orange-dark active:scale-95"
        >
          ×
        </button>
      )}
    </div>
  );
}

interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  size?: "default" | "compact";
}

export function SearchBar({
  value,
  onChange,
  placeholder = "",
  size = "default",
}: SearchBarProps) {
  const isCompact = size === "compact";

  return (
    <div className="relative">
      <input
        type="search"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-xl border border-[color:var(--input-border)] bg-input-surface text-text-brown shadow-[0_1px_2px_rgba(62,52,46,0.04)] placeholder:text-text-brown/40 focus:border-[color:var(--input-border-focus)] focus:outline-none focus:ring-2 focus:ring-input-orange/15 ${
          isCompact
            ? "py-2 pl-3 pr-10 text-xs"
            : "py-3 pl-4 pr-12 text-sm"
        }`}
      />
      <Image
        src="/assets/search.png"
        alt=""
        width={isCompact ? 16 : 20}
        height={isCompact ? 16 : 20}
        className={`absolute top-1/2 -translate-y-1/2 opacity-70 ${
          isCompact ? "right-3" : "right-4"
        }`}
      />
    </div>
  );
}

interface CategorySelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: readonly string[];
  label?: string;
  variant?: "default" | "orange";
  size?: "default" | "compact";
}

export function CategorySelect({
  value,
  onChange,
  options,
  label = "Todos",
  variant = "default",
  size = "default",
}: CategorySelectProps) {
  const isOrange = variant === "orange";
  const displayLabel = isOrange && !value ? "Categoria" : label;
  const selectOptions = [
    { value: "", label: displayLabel },
    ...options.map((opt) => ({ value: opt, label: opt })),
  ];

  return (
    <CustomSelect
      value={value}
      onChange={onChange}
      options={selectOptions}
      placeholder={displayLabel}
      ariaLabel="Filtrar por categoria"
      variant={variant}
      size={size}
    />
  );
}

interface SortSelectProps {
  value?: ListSortOption | "";
  onChange?: (value: ListSortOption | "") => void;
  size?: "default" | "compact";
}

export function SortSelect({
  value = "",
  onChange,
  size = "default",
}: SortSelectProps) {
  const options = [
    { value: "", label: "Filtros" },
    ...LIST_SORT_OPTIONS.map((opt) => ({ value: opt.value, label: opt.label })),
  ];

  return (
    <CustomSelect
      value={value}
      onChange={(next) => onChange?.(next as ListSortOption | "")}
      options={options}
      placeholder="Filtros"
      ariaLabel="Ordenar lista"
      leftIconSrc="/assets/filter.png"
      size={size}
    />
  );
}

interface ListBrowseFiltersProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  category: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: readonly string[];
  categoryLabel?: string;
  categoryVariant?: "default" | "orange";
  sort: ListSortOption | "";
  onSortChange: (value: ListSortOption | "") => void;
}

export function ListBrowseFilters({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar",
  category,
  onCategoryChange,
  categoryOptions,
  categoryLabel,
  categoryVariant = "default",
  sort,
  onSortChange,
}: ListBrowseFiltersProps) {
  return (
    <div className="mb-2 flex shrink-0 flex-col gap-2">
      {onSearchChange && (
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          size="compact"
        />
      )}
      <div className="grid grid-cols-2 gap-2">
        <CategorySelect
          value={category}
          onChange={onCategoryChange}
          options={categoryOptions}
          label={categoryLabel}
          variant={categoryVariant}
          size="compact"
        />
        <SortSelect value={sort} onChange={onSortChange} size="compact" />
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: PaginationProps) {
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="flex justify-between pt-2">
      <button
        type="button"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-input-orange text-sm font-bold text-white shadow-sm shadow-input-orange/20 transition-all ${
          canGoPrevious
            ? "hover:bg-orange-dark active:scale-95"
            : "cursor-not-allowed bg-input-orange/40 opacity-60"
        }`}
        aria-label="Página anterior"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        className={`flex h-10 w-10 items-center justify-center rounded-xl bg-input-orange text-sm font-bold text-white shadow-sm shadow-input-orange/20 transition-all ${
          canGoNext
            ? "hover:bg-orange-dark active:scale-95"
            : "cursor-not-allowed bg-input-orange/40 opacity-60"
        }`}
        aria-label="Próxima página"
      >
        ›
      </button>
    </div>
  );
}
