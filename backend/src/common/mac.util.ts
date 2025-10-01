export function normalizeMac(raw: string) {
  const hex = (raw || '').toUpperCase().replace(/[^0-9A-F]/g, '');
  if (hex.length !== 12) return raw.trim(); // оставим как есть, если странный ввод
  // канонический вид: AA-BB-CC-11-22-33
  return hex.match(/.{1,2}/g)!.join('-');
}
