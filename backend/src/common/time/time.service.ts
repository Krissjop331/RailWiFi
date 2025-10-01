import { Injectable } from '@nestjs/common';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

@Injectable()
export class TimeService {
  private readonly tz = process.env.TIMEZONE || 'Asia/Almaty';

  /** ISO в UTC (оканчивается на Z) */
  toUtcISO(d: Date | string | number): string {
    const date = new Date(d);
    return date.toISOString();
  }

  /** ISO с часовым поясом Казахстана, например 2025-09-28T14:13:00+05:00 */
  toLocalISO(d: Date | string | number): string {
    const date = new Date(d);
    const zoned = toZonedTime(date, this.tz);
    return format(zoned, "yyyy-MM-dd'T'HH:mm:ssXXX");
  }

  timezone(): string {
    return this.tz;
  }
}
