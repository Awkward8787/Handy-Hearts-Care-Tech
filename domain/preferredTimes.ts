import { PreferredTime } from '../types/entities';

export class PreferredTimes {
  static readonly values: PreferredTime[] = ['anytime', 'morning', 'afternoon', 'evening'];

  static isValue(value: string): value is PreferredTime {
    return PreferredTimes.values.includes(value as PreferredTime);
  }

  static label(value: string): string {
    switch (value) {
      case 'morning':
        return 'Morning';
      case 'afternoon':
        return 'Afternoon';
      case 'evening':
        return 'Evening';
      case 'anytime':
        return 'Anytime';
      default:
        return 'Anytime';
    }
  }

  static formatCivilDate(isoDate: string): string {
    const [year, month, day] = isoDate.split('-').map(Number);
    const civil = new Date(Date.UTC(year, month - 1, day));
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(civil);
  }
}
