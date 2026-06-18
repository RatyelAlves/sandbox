import type { AccountType } from "@/lib/auth-context";

export interface NavItem {
  href: string;
  icon: string;
  label: string;
  match?: string[];
}

export const usuarioNav: NavItem[] = [
  {
    href: "/usuario/home",
    icon: "/assets/home.png",
    label: "Home",
    match: ["/usuario/home"],
  },
  {
    href: "/usuario/terreiros",
    icon: "/assets/search.png",
    label: "Terreiros",
    match: ["/usuario/terreiros", "/usuario/eventos", "/usuario/sugestao"],
  },
  {
    href: "/usuario/favoritos",
    icon: "/assets/bookmark.png",
    label: "Favoritos",
    match: ["/usuario/favoritos"],
  },
  {
    href: "/usuario/perfil",
    icon: "/assets/avatar.png",
    label: "Perfil",
    match: ["/usuario/perfil"],
  },
];

export const terreiroDoacoesNav: NavItem = {
  href: "/terreiro/doacoes",
  icon: "/assets/doacoes.png",
  label: "Campanhas",
  match: ["/terreiro/doacoes"],
};

export const terreiroNav: NavItem[] = [
  {
    href: "/terreiro/home",
    icon: "/assets/home.png",
    label: "Home",
    match: ["/terreiro/home"],
  },
  {
    href: "/terreiro/eventos",
    icon: "/assets/events.png",
    label: "Eventos",
    match: ["/terreiro/eventos"],
  },
  terreiroDoacoesNav,
  {
    href: "/terreiro/favoritos",
    icon: "/assets/bookmark.png",
    label: "Favoritos",
    match: ["/terreiro/favoritos"],
  },
  {
    href: "/terreiro/perfil",
    icon: "/assets/avatar.png",
    label: "Perfil",
    match: ["/terreiro/perfil"],
  },
];

export const terreiroTerreirosNav: NavItem = {
  href: "/terreiro/terreiros",
  icon: "/assets/search.png",
  label: "Terreiros",
  match: ["/terreiro/terreiros"],
};

export function getNavItems(accountType: AccountType, includeExtras = false) {
  if (accountType === "usuario") return usuarioNav;
  if (!includeExtras) return terreiroNav;
  return [
    terreiroNav[0],
    terreiroNav[1],
    terreiroTerreirosNav,
    terreiroDoacoesNav,
    terreiroNav[3],
    terreiroNav[4],
  ];
}

export function isNavActive(pathname: string, item: NavItem) {
  return item.match?.some((m) => pathname.startsWith(m)) ?? false;
}
