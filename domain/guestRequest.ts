import { FieldLimits } from './fieldLimits';
import { EmailAddress } from './emailAddress';
import { PhoneNumber } from './phoneNumber';
import { PreferredTimes } from './preferredTimes';
import { SchedulePricing } from './schedulePricing';
import { ServiceCatalog } from './serviceCatalog';
import { PreferredTime, Urgency } from '../types/entities';

export interface NormalizedContact {
  fullName: string;
  email: string | null;
  phone: string | null;
  preferredDate: string;
  preferredTime: PreferredTime;
  notes: string | null;
}

export interface NormalizedConsultation extends NormalizedContact {
  topic: string;
}

export interface NormalizedOrder extends NormalizedContact {
  serviceCategory: string;
  urgency: Urgency;
  serviceType: 'in_home' | 'remote';
  address: string | null;
}

export class GuestRequest {
  static consultation(
    input: unknown,
    timeZone: string,
    now: Date = new Date(),
  ): { ok: true; value: NormalizedConsultation } | { ok: false; message: string } {
    const record = GuestRequest.asRecord(input);
    if (!record) return GuestRequest.fail('That request could not be read.');
    const contact = GuestRequest.contact(record, timeZone, now);
    if (!contact.ok) return contact;
    const topic = GuestRequest.text(record.topic);
    if (!ServiceCatalog.isConsultationTopic(topic)) {
      return GuestRequest.fail('Choose what you want to talk about.');
    }
    return { ok: true, value: { ...contact.value, topic } };
  }

  static quote(
    input: unknown,
    timeZone: string,
    now: Date = new Date(),
  ): { ok: true; value: Pick<NormalizedOrder, 'serviceCategory' | 'urgency' | 'preferredDate' | 'serviceType'> } | { ok: false; message: string } {
    const record = GuestRequest.asRecord(input);
    if (!record) return GuestRequest.fail('That request could not be read.');
    const serviceCategory = GuestRequest.text(record.serviceCategory);
    if (!ServiceCatalog.isBookableCategory(serviceCategory)) return GuestRequest.fail('Choose a service.');
    const urgency = GuestRequest.text(record.urgency || 'low');
    if (!GuestRequest.isUrgency(urgency)) return GuestRequest.fail('Choose how soon you need help.');
    const serviceType = GuestRequest.text(record.serviceType || 'remote');
    if (serviceType !== 'in_home' && serviceType !== 'remote') {
      return GuestRequest.fail('Choose an in-home visit or remote help.');
    }
    const preferredDate = GuestRequest.text(record.preferredDate);
    if (!SchedulePricing.isCivilDate(preferredDate)) return GuestRequest.fail('Choose a date.');
    if (SchedulePricing.isPast(preferredDate, timeZone, now)) {
      return GuestRequest.fail('Choose a date that is today or later.');
    }
    if (SchedulePricing.isBeyondHorizon(preferredDate, timeZone, now)) {
      return GuestRequest.fail('Choose a date within the next two years.');
    }
    return { ok: true, value: { serviceCategory, urgency, preferredDate, serviceType } };
  }

  static order(
    input: unknown,
    timeZone: string,
    now: Date = new Date(),
  ): { ok: true; value: NormalizedOrder } | { ok: false; message: string } {
    const record = GuestRequest.asRecord(input);
    if (!record) return GuestRequest.fail('That request could not be read.');
    const contact = GuestRequest.contact(record, timeZone, now);
    if (!contact.ok) return contact;
    const serviceCategory = GuestRequest.text(record.serviceCategory);
    if (!ServiceCatalog.isBookableCategory(serviceCategory)) {
      return GuestRequest.fail('Choose a service.');
    }
    const urgency = GuestRequest.text(record.urgency || 'low');
    if (!GuestRequest.isUrgency(urgency)) return GuestRequest.fail('Choose how soon you need help.');
    const serviceType = GuestRequest.text(record.serviceType || 'remote');
    if (serviceType !== 'in_home' && serviceType !== 'remote') {
      return GuestRequest.fail('Choose an in-home visit or remote help.');
    }
    const addressText = GuestRequest.text(record.address);
    if (serviceType === 'in_home' && !addressText) {
      return GuestRequest.fail('Enter the address for an in-home visit.');
    }
    if (addressText.length > FieldLimits.address) {
      return GuestRequest.fail('The address is too long.');
    }
    return {
      ok: true,
      value: {
        ...contact.value,
        serviceCategory,
        urgency,
        serviceType,
        address: serviceType === 'in_home' ? addressText : null,
      },
    };
  }

  private static contact(
    record: Record<string, unknown>,
    timeZone: string,
    now: Date,
  ): { ok: true; value: NormalizedContact } | { ok: false; message: string } {
    const fullName = GuestRequest.text(record.fullName);
    if (!fullName) return GuestRequest.fail('Enter your name.');
    if (fullName.length > FieldLimits.name) return GuestRequest.fail('That name is too long.');

    const emailText = GuestRequest.text(record.email);
    const phoneText = GuestRequest.text(record.phone);
    if (!emailText && !phoneText) return GuestRequest.fail('Enter an email or a phone number.');
    if (emailText && !EmailAddress.isValid(emailText)) return GuestRequest.fail('Enter a valid email.');
    const phone = phoneText ? PhoneNumber.normalize(phoneText) : null;
    if (phoneText && !phone) return GuestRequest.fail('Enter a phone number with at least 10 digits.');

    const preferredDate = GuestRequest.text(record.preferredDate);
    if (!SchedulePricing.isCivilDate(preferredDate)) return GuestRequest.fail('Choose a date.');
    if (SchedulePricing.isPast(preferredDate, timeZone, now)) {
      return GuestRequest.fail('Choose a date that is today or later.');
    }
    if (SchedulePricing.isBeyondHorizon(preferredDate, timeZone, now)) {
      return GuestRequest.fail('Choose a date within the next two years.');
    }
    const preferredTime = GuestRequest.text(record.preferredTime || 'anytime');
    if (!PreferredTimes.isValue(preferredTime)) return GuestRequest.fail('Choose a preferred time.');

    const notes = GuestRequest.text(record.notes);
    if (notes.length > FieldLimits.notes) return GuestRequest.fail('The note is too long.');

    return {
      ok: true,
      value: {
        fullName,
        email: emailText ? emailText.toLowerCase() : null,
        phone,
        preferredDate,
        preferredTime,
        notes: notes || null,
      },
    };
  }

  private static isUrgency(value: string): value is Urgency {
    return value === 'low' || value === 'medium' || value === 'high' || value === 'emergency';
  }

  private static asRecord(input: unknown): Record<string, unknown> | null {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
    return input as Record<string, unknown>;
  }

  private static text(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private static fail(message: string): { ok: false; message: string } {
    return { ok: false, message };
  }
}
