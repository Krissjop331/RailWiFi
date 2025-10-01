import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

export function formatKzLocalFromUtc(utcIso: string, tz: string) {
  const utc = new Date(utcIso); // ISO с Z
  const zoned = toZonedTime(utc, tz); // перевод в нужный пояс
  // Пример: 29 сентября 2025 года 15:05:25
  return format(zoned, "d MMMM yyyy 'года' HH:mm:ss", { locale: ru });
}

export function humanizeLeft(ms: number) {
  if (ms <= 0) return '0 сек';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const parts: string[] = [];
  if (d) parts.push(`${d} д`);
  if (h) parts.push(`${h} ч`);
  if (m) parts.push(`${m} мин`);
  parts.push(`${s} сек`);
  return parts.join(' ');
}
