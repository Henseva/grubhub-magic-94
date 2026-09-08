import { formatBrazilianPhone } from './phone';

export function formatCEP(val: string): string {
  const digits = val.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export const formatCep = formatCEP;

export const formatPhone = formatBrazilianPhone;
export { formatBrazilianPhone } from './phone';
export { validateBrazilianPhone, BRAZILIAN_DDDS } from './phone';
export type { PhoneValidationResult, DddInfo } from './phone';


export interface ViaCepResult {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export async function fetchAddressByCep(
  rawCep: string
): Promise<{ street: string; neighborhood: string; city: string } | null> {
  const clean = rawCep.replace(/\D/g, '');
  if (clean.length !== 8) {
    return null;
  }

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data: ViaCepResult = await res.json();
    if (data.erro) return null;

    return {
      street: data.logradouro || '',
      neighborhood: data.bairro || '',
      city: data.localidade ? `${data.localidade} - ${data.uf}` : ''
    };
  } catch {
    return null;
  }
}
