// Utilitário para geração de deep links de GPS (Waze, Google Maps e Apple Maps)
export function getGoogleMapsUrl(address: string): string {
  if (!address || !address.trim()) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.trim())}`;
}

export function getWazeUrl(address: string): string {
  if (!address || !address.trim()) return '';
  return `https://waze.com/ul?q=${encodeURIComponent(address.trim())}&navigate=yes`;
}

export function formatAddressForGPS(cust?: {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
} | null, locationAddress?: string): string {
  if (locationAddress && locationAddress.trim()) {
    return locationAddress.trim();
  }
  if (!cust) return '';
  const parts = [
    cust.street ? `${cust.street}${cust.number ? `, ${cust.number}` : ''}` : '',
    cust.neighborhood || '',
    cust.city || '',
    cust.state || '',
  ].filter(Boolean);
  return parts.join(' - ');
}
