import type { BodyType, LookingFor, PhotoKind, Position } from "@/lib/types";

export const LOOKING_FOR_OPTIONS: { value: LookingFor; label: string }[] = [
  { value: "encontros", label: "Encontros" },
  { value: "amizade", label: "Amizade" },
  { value: "relacionamento", label: "Relacionamento" },
  { value: "sem_pressa", label: "Sem pressa" },
];

export const PHOTO_KIND_OPTIONS: { value: PhotoKind; label: string }[] = [
  { value: "body", label: "Corpo" },
  { value: "face", label: "Rosto" },
  { value: "other", label: "Outra" },
];

export function lookingForLabel(value: LookingFor) {
  return LOOKING_FOR_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function photoKindLabel(value: PhotoKind) {
  return PHOTO_KIND_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export const BODY_TYPE_OPTIONS: { value: BodyType; label: string }[] = [
  { value: "magro", label: "Magro" },
  { value: "atlético", label: "Atlético" },
  { value: "médio", label: "Médio" },
  { value: "grande", label: "Grande" },
  { value: "musculoso", label: "Musculoso" },
];

export const POSITION_OPTIONS: { value: Position; label: string }[] = [
  { value: "ativo", label: "Ativo" },
  { value: "passivo", label: "Passivo" },
  { value: "versátil", label: "Versátil" },
];

export function bodyTypeLabel(value: BodyType | null | undefined) {
  if (!value) return null;
  return BODY_TYPE_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function positionLabel(value: Position | null | undefined) {
  if (!value) return null;
  return POSITION_OPTIONS.find((item) => item.value === value)?.label ?? value;
}

export function profileStats(profile: {
  height_cm?: number | null;
  weight_kg?: number | null;
  body_type?: BodyType | null;
  position?: Position | null;
}) {
  return [
    profile.height_cm ? `${profile.height_cm} cm` : null,
    profile.weight_kg ? `${profile.weight_kg} kg` : null,
    bodyTypeLabel(profile.body_type),
    positionLabel(profile.position),
  ].filter(Boolean) as string[];
}
