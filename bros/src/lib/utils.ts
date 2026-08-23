export function cn(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export function authErrorMessage(message: string) {
  const text = message.toLowerCase();
  if (text.includes("invalid login") || text.includes("invalid credentials")) {
    return "Email ou senha incorretos.";
  }
  if (
    text.includes("expired") ||
    text.includes("invalid") && (text.includes("token") || text.includes("otp") || text.includes("link"))
  ) {
    return "Este link expirou ou já foi usado. Peça outro.";
  }
  if (text.includes("already registered") || text.includes("already been registered")) {
    return "Este email já está cadastrado.";
  }
  if (text.includes("password")) {
    return "A senha precisa ter pelo menos 6 caracteres.";
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return "Muitas tentativas. Espere um minuto e tente de novo.";
  }
  if (text.includes("email")) {
    return "Confira o email e tente novamente.";
  }
  return "Não foi possível concluir. Tente de novo.";
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatDay(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));
}

export function initials(alias: string) {
  const parts = alias.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "B";
}
