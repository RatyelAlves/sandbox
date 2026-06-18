/** Card mobile com lista ou formulário scrollável */
export const mobileListCardClass =
  "my-2 flex min-h-0 w-full flex-1 flex-col overflow-hidden md:hidden";

/** Conteúdo scrollável dentro do card mobile */
export const mobileProfileScrollClass =
  "flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain";

/** Layout da home mobile (mapa + ações) */
export const mobileHomeLayoutClass =
  "flex min-h-0 flex-1 flex-col gap-2 overflow-hidden md:hidden";

export const mobileHomeMapClass = "relative min-h-0 flex-1";

export const mobileHomeActionsClass = "flex shrink-0 flex-col gap-2";

/** @deprecated Use mobileListCardClass */
export const terreiroMobileCardClass = mobileListCardClass;
