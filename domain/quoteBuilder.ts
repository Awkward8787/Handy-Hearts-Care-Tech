import { PriceBreakdown, Urgency } from '../types/entities';
import { ServiceRecord } from '../types/guest';
import { PricingEngine } from './pricingEngine';
import { SchedulePricing } from './schedulePricing';
import { ServiceCatalog } from './serviceCatalog';

export class QuoteBuilder {
  static build(input: {
    services: ServiceRecord[];
    serviceCategory: string;
    urgency: Urgency;
    preferredDate: string;
    timeZone: string;
    now?: Date;
  }): { priced: false } | { priced: true; service: ServiceRecord; quote: PriceBreakdown } {
    const service = ServiceCatalog.matchService(
      input.services.filter((item) => item.isActive),
      input.serviceCategory,
    );
    if (!service) return { priced: false };
    const flags = SchedulePricing.flags(input.preferredDate, input.timeZone, input.now ?? new Date());
    const quote = PricingEngine.calculate(
      { name: service.name, baseRate: service.baseRateCents, minHours: service.minHours },
      service.minHours,
      { isWeekend: flags.isWeekend, isSameDay: flags.isSameDay, urgency: input.urgency },
    );
    return { priced: true, service, quote };
  }
}
