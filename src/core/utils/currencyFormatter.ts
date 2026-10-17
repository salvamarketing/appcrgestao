/**
 * Utilitário central de formatação monetária (Real Brasileiro - BRL)
 * Garante consistência em todo o sistema (Admin, Mobile, Relatórios e PDFs).
 */

const btlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Converte qualquer valor numérico ou representação em string para formato 'R$ 1.250,00'
 */
export function formatCurrencyBRL(value?: number | string | null): string {
  if (value === undefined || value === null || value === '') {
    return 'R$ 0,00';
  }
  const numeric = typeof value === 'number' ? value : parseFloat(String(value).replace(',', '.'));
  if (isNaN(numeric)) {
    return 'R$ 0,00';
  }
  return btlFormatter.format(numeric);
}

/**
 * Converte string 'R$ 1.250,50' ou '1250,50' de volta para número puro (1250.50)
 */
export function parseCurrencyBRL(input?: string | number | null): number {
  if (typeof input === 'number') return input;
  if (!input) return 0;
  const clean = String(input)
    .replace(/[^\d,-]/g, '')
    .replace(',', '.');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}
