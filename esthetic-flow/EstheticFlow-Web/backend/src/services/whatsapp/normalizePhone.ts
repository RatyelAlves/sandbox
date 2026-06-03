export function normalizeBrazilPhone(
  raw: string
): string {

  const digits =
    raw.replace(/\D/g, "");

  if (!digits) {
    throw new Error(
      "Informe um número de telefone válido"
    );
  }

  if (
    digits.length === 10 ||
    digits.length === 11
  ) {
    return `55${digits}`;
  }

  return digits;
}

export function phoneToWhatsappJid(
  phone: string
): string {

  return `${phone}@s.whatsapp.net`;
}
