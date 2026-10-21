export class SchedulePricing {
  static readonly DEFAULT_TIME_ZONE = 'UTC';

  static flags(
    preferredDate: string,
    timeZone: string,
    now: Date = new Date(),
  ): { isWeekend: boolean; isSameDay: boolean } {
    if (!SchedulePricing.isCivilDate(preferredDate)) {
      return { isWeekend: false, isSameDay: false };
    }
    const [year, month, day] = preferredDate.split('-').map(Number);
    const civil = new Date(Date.UTC(year, month - 1, day));
    const weekday = civil.getUTCDay();
    return {
      isWeekend: weekday === 0 || weekday === 6,
      isSameDay: SchedulePricing.civilToday(timeZone, now) === preferredDate,
    };
  }

  static isCivilDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    const civil = new Date(Date.UTC(year, month - 1, day));
    return civil.getUTCFullYear() === year && civil.getUTCMonth() === month - 1 && civil.getUTCDate() === day;
  }

  static civilToday(timeZone: string, now: Date = new Date()): string {
    const zone = SchedulePricing.isTimeZone(timeZone) ? timeZone : SchedulePricing.DEFAULT_TIME_ZONE;
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: zone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  }

  static isPast(preferredDate: string, timeZone: string, now: Date = new Date()): boolean {
    if (!SchedulePricing.isCivilDate(preferredDate)) return true;
    return preferredDate < SchedulePricing.civilToday(timeZone, now);
  }

  static isBeyondHorizon(preferredDate: string, timeZone: string, now: Date = new Date(), horizonDays = 730): boolean {
    if (!SchedulePricing.isCivilDate(preferredDate)) return true;
    const today = SchedulePricing.civilToday(timeZone, now);
    const [year, month, day] = today.split('-').map(Number);
    const horizon = new Date(Date.UTC(year, month - 1, day));
    horizon.setUTCDate(horizon.getUTCDate() + horizonDays);
    const horizonIso = horizon.toISOString().slice(0, 10);
    return preferredDate > horizonIso;
  }

  static isTimeZone(value: string): boolean {
    try {
      Intl.DateTimeFormat('en-CA', { timeZone: value }).format(new Date());
      return true;
    } catch {
      return false;
    }
  }
}
