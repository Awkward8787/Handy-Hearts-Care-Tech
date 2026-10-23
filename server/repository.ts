import { InquiryStatus } from '../types/entities';
import {
  ConfirmationChannelStatus,
  ConfirmationRecord,
  ConsultationRecord,
  PaymentRecord,
  ServiceOrderRecord,
  ServiceRecord,
} from '../types/guest';

export interface ProviderAccount {
  id: string;
  name: string;
  email: string;
  stripeAccountId: string | null;
}

export interface GuestRepository {
  ready(): boolean;
  supportsProviderAccounts(): boolean;
  createConsultation(record: ConsultationRecord): Promise<void>;
  createOrder(record: ServiceOrderRecord): Promise<void>;
  saveConfirmation(record: ConfirmationRecord): Promise<void>;
  confirmationStatus(reference: string): Promise<{ email: ConfirmationChannelStatus; sms: ConfirmationChannelStatus }>;
  findConsultation(reference: string): Promise<ConsultationRecord | null>;
  findOrder(reference: string): Promise<ServiceOrderRecord | null>;
  referenceExists(reference: string): Promise<boolean>;
  listConsultations(): Promise<ConsultationRecord[]>;
  listOrders(): Promise<ServiceOrderRecord[]>;
  listServices(): Promise<ServiceRecord[]>;
  saveService(service: ServiceRecord): Promise<void>;
  updateServiceRate(id: string, baseRateCents: number): Promise<boolean>;
  listProviders(): Promise<ProviderAccount[]>;
  providerAccount(userId: string): Promise<ProviderAccount | null>;
  saveProviderAccount(userId: string, stripeAccountId: string): Promise<boolean>;
  assignOrder(reference: string, providerUserId: string, updatedAt: string): Promise<boolean>;
  updateOrderStatus(reference: string, status: InquiryStatus, actorProviderId: string | null, updatedAt: string): Promise<boolean>;
  closeConsultation(reference: string): Promise<boolean>;
  markOrderPaid(reference: string, payment: PaymentRecord, updatedAt: string): Promise<boolean>;
}
