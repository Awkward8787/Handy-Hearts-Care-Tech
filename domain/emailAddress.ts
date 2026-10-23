import { FieldLimits } from './fieldLimits';

export class EmailAddress {
  static isValid(value: string): boolean {
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > FieldLimits.email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  }
}
