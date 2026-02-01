
import { ServiceType, PriceBreakdown, PriceItem } from '../types/entities';

/**
 * Deterministic pricing engine for HandyHearts.
 * Ensures that the same inputs always result in the same line-item breakdown.
 */
export class PricingEngine {
  static calculate(
    service: ServiceType,
    hours: number,
    isWeekend: boolean = false,
    isSameDay: boolean = false
  ): PriceBreakdown {
    const items: PriceItem[] = [];
    
    // 1. Base Service Cost
    const actualHours = Math.max(hours, service.minHours);
    const baseTotal = actualHours * service.baseRate;
    items.push({
      label: `${service.name} (${actualHours}h @ $${(service.baseRate / 100).toFixed(2)}/hr)`,
      amount: baseTotal
    });

    // 2. Weekend Surcharge (15%)
    let runningTotal = baseTotal;
    if (isWeekend) {
      const weekendFee = Math.round(baseTotal * 0.15);
      items.push({ label: 'Weekend Surcharge (15%)', amount: weekendFee });
      runningTotal += weekendFee;
    }

    // 3. Same Day Rush Fee ($25 flat)
    if (isSameDay) {
      const rushFee = 2500;
      items.push({ label: 'Same Day Rush Fee', amount: rushFee });
      runningTotal += rushFee;
    }

    return {
      items,
      total: runningTotal
    };
  }
}
