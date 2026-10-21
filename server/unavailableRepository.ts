import { InquiryStatus } from '../types/entities';
import { ConfirmationRecord, ConsultationRecord, ServiceOrderRecord, ServiceRecord } from '../types/guest';
import { GuestRepository, ProviderAccount } from './repository';

export class UnavailableRepository implements GuestRepository {
  ready(): boolean {
    return false;
  }

  supportsProviderAccounts(): boolean {
    return false;
  }

  async createConsultation(_record: ConsultationRecord): Promise<void> {
    throw new Error('STORE_UNAVAILABLE');
  }

  async createOrder(_record: ServiceOrderRecord): Promise<void> {
    throw new Error('STORE_UNAVAILABLE');
  }

  async saveConfirmation(_record: ConfirmationRecord): Promise<void> {
    throw new Error('STORE_UNAVAILABLE');
  }

  async confirmationStatus(): Promise<{ email: 'skipped'; sms: 'skipped' }> {
    return { email: 'skipped', sms: 'skipped' };
  }

  async findConsultation(): Promise<null> {
    return null;
  }

  async findOrder(): Promise<null> {
    return null;
  }

  async referenceExists(): Promise<boolean> {
    return false;
  }

  async listConsultations(): Promise<ConsultationRecord[]> {
    return [];
  }

  async listOrders(): Promise<ServiceOrderRecord[]> {
    return [];
  }

  async listServices(): Promise<ServiceRecord[]> {
    return [];
  }

  async saveService(_service: ServiceRecord): Promise<void> {
    throw new Error('STORE_UNAVAILABLE');
  }

  async updateServiceRate(): Promise<boolean> {
    return false;
  }

  async listProviders(): Promise<ProviderAccount[]> {
    return [];
  }

  async providerAccount(): Promise<null> {
    return null;
  }

  async saveProviderAccount(): Promise<boolean> {
    return false;
  }

  async assignOrder(): Promise<boolean> {
    return false;
  }

  async updateOrderStatus(_reference: string, _status: InquiryStatus, _actorProviderId: string | null, _updatedAt: string): Promise<boolean> {
    return false;
  }

  async closeConsultation(): Promise<boolean> {
    return false;
  }

  async markOrderPaid(): Promise<boolean> {
    return false;
  }
}
