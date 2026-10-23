import { FieldLimits } from './fieldLimits';

export class PhoneNumber {
  static digits(value: string): string {
    return value.replace(/\D/g, '');
  }

  /**
   * Returns a stored phone value, or null when the digit count is outside 10–15.
   * A leading + is kept when the person typed one. Otherwise only digits are stored.
   */
  static normalize(value: string): string | null {
    const trimmed = value.trim();
    const digits = PhoneNumber.digits(trimmed);
    if (digits.length < FieldLimits.phoneDigitsMin || digits.length > FieldLimits.phoneDigitsMax) {
      return null;
    }
    return trimmed.startsWith('+') ? `+${digits}` : digits;
  }
}
