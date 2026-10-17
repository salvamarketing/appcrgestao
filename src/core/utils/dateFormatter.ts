/**
 * Utilitário central de formatação de datas e horas em padrão Brasileiro (PT-BR)
 */

export function formatDatePTBR(dateInput?: string | Date | null): string {
  if (!dateInput) return '--/--/----';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '--/--/----';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '--/--/----';
  }
}

export function formatDateTimePTBR(dateInput?: string | Date | null): string {
  if (!dateInput) return '--/--/---- --:--';
  try {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return '--/--/---- --:--';
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '--/--/---- --:--';
  }
}

export function getCurrentMonthFormatted(): string {
  try {
    const raw = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date());
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  } catch {
    return '';
  }
}

export function getTodayISODate(): string {
  return new Date().toISOString().split('T')[0];
}
