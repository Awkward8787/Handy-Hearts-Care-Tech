import { describe, expect, it } from 'vitest';
import { PricingEngine } from './pricingEngine';

const service = { name: 'Device Setup', baseRate: 3500, minHours: 2 };

describe('PricingEngine', () => {
  it('charges minimum hours at the service rate', () => {
    const quote = PricingEngine.calculate(service, 1);
    expect(quote.items).toEqual([
      { label: 'Device Setup (2h @ $35.00/hr)', amount: 7000 },
    ]);
    expect(quote.total).toBe(7000);
  });

  it('adds a 15% weekend surcharge rounded to cents', () => {
    const quote = PricingEngine.calculate(service, 2, { isWeekend: true });
    expect(quote.items[1]).toEqual({ label: 'Weekend Surcharge (15%)', amount: 1050 });
    expect(quote.total).toBe(8050);
  });

  it('adds the expedited fee for medium urgency and the emergency fee for high or emergency', () => {
    expect(PricingEngine.calculate(service, 2, { urgency: 'medium' }).total).toBe(8500);
    expect(PricingEngine.calculate(service, 2, { urgency: 'high' }).total).toBe(9500);
    expect(PricingEngine.calculate(service, 2, { urgency: 'emergency' }).total).toBe(9500);
  });

  it('stacks same-day and emergency fees when both apply', () => {
    const quote = PricingEngine.calculate(service, 2, { isSameDay: true, urgency: 'emergency' });
    expect(quote.total).toBe(7000 + 2500 + 2500);
  });

  it('rejects invalid hours and rates', () => {
    expect(() => PricingEngine.calculate(service, -1)).toThrow(/Hours/);
    expect(() => PricingEngine.calculate({ ...service, baseRate: Number.NaN }, 2)).toThrow(/base rate/);
    expect(() => PricingEngine.calculate({ ...service, minHours: 0 }, 2)).toThrow(/minimum hours/);
  });
});
