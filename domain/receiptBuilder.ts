import { ConsultationRecord, ConfirmationChannelStatus, Receipt, ServiceOrderRecord } from '../types/guest';
import { VisitStatus } from './visitStatus';
import { ConfirmationCopy } from './confirmationCopy';
import { PreferredTimes } from './preferredTimes';
import { ServiceCatalog } from './serviceCatalog';

export class ReceiptBuilder {
  static fromConsultation(
    record: ConsultationRecord,
    emailConfirmation: ConfirmationChannelStatus,
    smsConfirmation: ConfirmationChannelStatus,
  ): Receipt {
    return {
      kind: 'consultation',
      reference: record.reference,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      title: ServiceCatalog.consultationLabel(record.topic),
      preferredDate: record.preferredDate,
      preferredTime: record.preferredTime,
      preferredTimeLabel: PreferredTimes.label(record.preferredTime),
      serviceType: null,
      address: null,
      notes: record.notes,
      items: [],
      totalCents: 0,
      priced: false,
      paymentStatus: 'not_due',
      summary: ConfirmationCopy.consultationSummary(record),
      emailConfirmation,
      smsConfirmation,
      statusLabel: record.status === 'closed' ? 'Closed' : 'Submitted',
      createdAt: record.createdAt,
    };
  }

  static fromOrder(
    record: ServiceOrderRecord,
    emailConfirmation: ConfirmationChannelStatus,
    smsConfirmation: ConfirmationChannelStatus,
  ): Receipt {
    return {
      kind: 'order',
      reference: record.reference,
      fullName: record.fullName,
      email: record.email,
      phone: record.phone,
      title: ServiceCatalog.labelFor(record.serviceCategory),
      preferredDate: record.preferredDate,
      preferredTime: record.preferredTime,
      preferredTimeLabel: PreferredTimes.label(record.preferredTime),
      serviceType: record.serviceType,
      address: record.address,
      notes: record.notes,
      items: record.priceItems,
      totalCents: record.totalPriceCents,
      priced: record.totalPriceCents > 0,
      paymentStatus: record.paymentStatus,
      summary: ConfirmationCopy.orderSummary(record),
      emailConfirmation,
      smsConfirmation,
      statusLabel: VisitStatus.label(record.status),
      createdAt: record.createdAt,
    };
  }
}
