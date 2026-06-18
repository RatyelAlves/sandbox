export interface CepAddress {
  uf: string;
  cidade: string;
  bairro: string;
  rua: string;
}

export function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export function cepDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export async function fetchAddressByCep(cep: string): Promise<CepAddress | null> {
  const digits = cepDigits(cep);
  if (digits.length !== 8) return null;

  const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  if (!response.ok) {
    throw new Error("fetch_failed");
  }

  const data = (await response.json()) as {
    erro?: boolean;
    uf?: string;
    localidade?: string;
    bairro?: string;
    logradouro?: string;
  };

  if (data.erro) return null;

  return {
    uf: data.uf ?? "",
    cidade: data.localidade ?? "",
    bairro: data.bairro ?? "",
    rua: data.logradouro ?? "",
  };
}
