/**
 * Utilitário central de sanitização de telefones e integração segura com WhatsApp
 */

/**
 * Remove qualquer caracter não numérico de um telefone
 */
export function sanitizePhone(phone?: string | null): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Aplica máscara de telefone brasileiro: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
 */
export function formatPhoneMask(phone?: string | null): string {
  const digits = sanitizePhone(phone);
  if (!digits) return '';

  if (digits.length <= 10) {
    // (XX) XXXX-XXXX
    return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  }
  // (XX) XXXXX-XXXX
  return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
}

/**
 * Constrói URL direta e segura para o WhatsApp Web ou App nativo
 */
export function buildWhatsAppUrl(phone?: string | null, message?: string): string {
  let digits = sanitizePhone(phone);
  if (!digits) return '';

  // Garante DDI do Brasil (55) caso não informado
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }

  const encodedMsg = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${digits}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}
