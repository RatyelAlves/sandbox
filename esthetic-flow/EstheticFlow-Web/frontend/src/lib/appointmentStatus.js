export const APPOINTMENT_STATUSES = [
  "scheduled",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

export const STATUS_LABELS = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  completed: "Concluído",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

export const STATUS_STYLES = {
  scheduled:
    "bg-sky-50 text-sky-700 border-sky-200",

  confirmed:
    "bg-rose-50 text-rose-700 border-rose-200",

  completed:
    "bg-emerald-50 text-emerald-700 border-emerald-200",

  cancelled:
    "bg-zinc-100 text-zinc-600 border-zinc-200",

  no_show:
    "bg-amber-50 text-amber-700 border-amber-200",
};

export const STATUS_DOT_STYLES = {
  scheduled: "bg-sky-500",
  confirmed: "bg-rose-500",
  completed: "bg-emerald-500",
  cancelled: "bg-zinc-400",
  no_show: "bg-amber-500",
};
