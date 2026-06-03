export const PROCEDURE_CATEGORIES = [
  "Facial",
  "Depilação",
  "Capilar",
  "Massagem",
  "Corporal",
];

export const CATEGORY_STYLES = {
  Facial: {
    badge: "bg-rose-100 text-rose-700",
    blob: "from-rose-200/80 to-rose-100/40",
  },
  Depilação: {
    badge: "bg-emerald-100 text-emerald-700",
    blob: "from-emerald-200/80 to-emerald-100/40",
  },
  Capilar: {
    badge: "bg-amber-100 text-amber-700",
    blob: "from-amber-200/80 to-amber-100/40",
  },
  Massagem: {
    badge: "bg-sky-100 text-sky-700",
    blob: "from-sky-200/80 to-sky-100/40",
  },
  Corporal: {
    badge: "bg-violet-100 text-violet-700",
    blob: "from-violet-200/80 to-violet-100/40",
  },
};

export function getCategoryStyle(category) {
  return (
    CATEGORY_STYLES[category] ??
    CATEGORY_STYLES.Facial
  );
}

export function formatPriceBrl(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (!rest) {
    return `${hours}h`;
  }

  return `${hours}h ${rest}min`;
}

export function formatDurationShort(minutes) {
  return `${minutes}min`;
}
