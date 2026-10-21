import { ConsultationRecord, ServiceOrderRecord } from '../types/guest';
import { PricingEngine } from './pricingEngine';
import { PreferredTimes } from './preferredTimes';
import { ServiceCatalog } from './serviceCatalog';

export class ConfirmationCopy {
  static consultationSummary(record: ConsultationRecord): string {
    const when = `${PreferredTimes.formatCivilDate(record.preferredDate)}, ${PreferredTimes.label(record.preferredTime)}`;
    const topic = ServiceCatalog.consultationLabel(record.topic);
    return `Consultation ${record.reference} is saved for ${record.fullName}. Topic: ${topic}. Preferred time: ${when}. ${ConfirmationCopy.followUp(record.email, record.phone)}`;
  }

  static orderSummary(record: ServiceOrderRecord): string {
    const when = `${PreferredTimes.formatCivilDate(record.preferredDate)}, ${PreferredTimes.label(record.preferredTime)}`;
    const title = ServiceCatalog.labelFor(record.serviceCategory);
    const where = record.serviceType === 'in_home' ? 'In-home visit.' : 'Remote visit.';
    const price = record.totalPriceCents > 0
      ? `Quoted price: $${PricingEngine.formatDollars(record.totalPriceCents)}.`
      : 'Price to be confirmed. No payment was taken with this booking.';
    const payment = record.paymentStatus === 'paid' ? ' Payment was received.' : '';
    return `Booking ${record.reference} is saved for ${record.fullName}. Service: ${title}. Preferred time: ${when} ${where} ${price}${payment} ${ConfirmationCopy.followUp(record.email, record.phone)}`;
  }

  static emailSubject(kind: 'consultation' | 'order', reference: string): string {
    return kind === 'consultation'
      ? `HandyHearts consultation ${reference}`
      : `HandyHearts booking ${reference}`;
  }

  static sms(summary: string): string {
    const compact = summary.replace(/\s+/g, ' ').trim();
    return compact.length <= 320 ? compact : `${compact.slice(0, 317)}...`;
  }

  static followUp(email: string | null, phone: string | null): string {
    const parts = [email, phone].filter((value): value is string => Boolean(value));
    if (parts.length === 0) return 'Keep this receipt and reference.';
    return `We will follow up at ${parts.join(' and ')}. Keep this receipt and reference.`;
  }
}
