import { InquiryStatus, PreferredTime, PriceItem, Urgency } from './entities';

export type ConfirmationChannelStatus = 'sent' | 'queued' | 'failed' | 'skipped';

export type PaymentStatus = 'not_due' | 'unpaid' | 'paid';

export interface ConsultationRecord {
  reference: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  topic: string;
  preferredDate: string;
  preferredTime: PreferredTime;
  notes: string | null;
  status: 'submitted' | 'closed';
  createdAt: string;
}

export interface ServiceOrderRecord {
  reference: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  serviceCategory: string;
  serviceId: string | null;
  urgency: Urgency;
  preferredDate: string;
  preferredTime: PreferredTime;
  serviceType: 'in_home' | 'remote';
  address: string | null;
  notes: string | null;
  totalPriceCents: number;
  priceItems: PriceItem[];
  providerPayoutCents: number;
  platformFeeCents: number;
  paymentIntentId: string | null;
  paymentStatus: PaymentStatus;
  status: InquiryStatus;
  assignedProviderUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmationRecord {
  reference: string;
  channel: 'email' | 'sms';
  destination: string;
  subject: string | null;
  body: string;
  status: Exclude<ConfirmationChannelStatus, 'skipped'>;
  createdAt: string;
}

export interface ServiceRecord {
  id: string;
  name: string;
  description: string;
  baseRateCents: number;
  minHours: number;
  isActive: boolean;
}

export interface PaymentRecord {
  id: string;
  reference: string;
  amountCents: number;
  status: 'paid';
  createdAt: string;
}

export interface Receipt {
  kind: 'consultation' | 'order';
  reference: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  title: string;
  preferredDate: string;
  preferredTime: PreferredTime;
  preferredTimeLabel: string;
  serviceType: 'in_home' | 'remote' | null;
  address: string | null;
  notes: string | null;
  items: PriceItem[];
  totalCents: number;
  priced: boolean;
  paymentStatus: PaymentStatus;
  summary: string;
  emailConfirmation: ConfirmationChannelStatus;
  smsConfirmation: ConfirmationChannelStatus;
  statusLabel: string;
  createdAt: string;
}
