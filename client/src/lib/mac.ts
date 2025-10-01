export const MAC_KEY = 'trainwifi_mac';

export function saveMac(mac: string) {
  localStorage.setItem(MAC_KEY, mac.trim());
}

export function loadMac(): string {
  return localStorage.getItem(MAC_KEY) || '';
}

export function macPretty(mac: string) {
  return mac.toUpperCase();
}
