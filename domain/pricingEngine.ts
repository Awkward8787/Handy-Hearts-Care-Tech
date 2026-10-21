import { PriceBreakdown, PriceItem, ServiceType, Urgency } from '../types/entities';

export interface PricingOptions {
  isWeekend?: boolean;
  isSameDay?: boolean;
  urgency?: Urgency;
}

/**
 * Deterministic pricing for a visit.
 * Amounts are integer cents. The same inputs always return the same line items.
 */
export class PricingEngine {
  static readonly WEEKEND_SURCHARGE_RATE = 0.15;
  static readonly EXPEDITED_FEE_CENTS = 1500;
  static readonly EMERGENCY_FEE_CENTS = 2500;
  static readonly SAME_DAY_FEE_CENTS = 2500;

  static calculate(service: ServiceType, hours: number, options: PricingOptions = {}): PriceBreakdown {
    if (!Number.isFinite(hours) || hours < 0) {
      throw new Error('Hours must be a non-negative finite number.');
    }
    if (!Number.isFinite(service.baseRate) || service.baseRate < 0) {
      throw new Error('Service base rate must be a non-negative finite number.');
    }
    if (!Number.isFinite(service.minHours) || service.minHours <= 0) {
      throw new Error('Service minimum hours must be greater than zero.');
    }

    const items: PriceItem[] = [];
    const actualHours = Math.max(hours, service.minHours);
    const baseTotal = Math.round(actualHours * service.baseRate);
    items.push({
      label: `${service.name} (${PricingEngine.formatHours(actualHours)}h @ $${PricingEngine.formatDollars(service.baseRate)}/hr)`,
      amount: baseTotal,
    });

    let runningTotal = baseTotal;

    if (options.isWeekend) {
      const weekendFee = Math.round(baseTotal * PricingEngine.WEEKEND_SURCHARGE_RATE);
      items.push({ label: 'Weekend Surcharge (15%)', amount: weekendFee });
      runningTotal += weekendFee;
    }

    if (options.isSameDay) {
      items.push({ label: 'Same Day Rush Fee', amount: PricingEngine.SAME_DAY_FEE_CENTS });
      runningTotal += PricingEngine.SAME_DAY_FEE_CENTS;
    }

    const urgency = options.urgency ?? 'low';
    if (urgency === 'medium') {
      items.push({ label: 'Expedited Fee', amount: PricingEngine.EXPEDITED_FEE_CENTS });
      runningTotal += PricingEngine.EXPEDITED_FEE_CENTS;
    } else if (urgency === 'high' || urgency === 'emergency') {
      items.push({ label: 'Emergency Fee', amount: PricingEngine.EMERGENCY_FEE_CENTS });
      runningTotal += PricingEngine.EMERGENCY_FEE_CENTS;
    }

    return { items, total: runningTotal };
  }

  static formatDollars(cents: number): string {
    return (cents / 100).toFixed(2);
  }

  static formatHours(hours: number): string {
    if (Number.isInteger(hours)) return String(hours);
    return String(hours);
  }
}
