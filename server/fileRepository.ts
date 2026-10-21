import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { InquiryStatus } from '../types/entities';
import {
  ConfirmationChannelStatus,
  ConfirmationRecord,
  ConsultationRecord,
  PaymentRecord,
  ServiceOrderRecord,
  ServiceRecord,
} from '../types/guest';
import { GuestRepository, ProviderAccount } from './repository';

interface StoreFile {
  consultations: ConsultationRecord[];
  orders: ServiceOrderRecord[];
  confirmations: ConfirmationRecord[];
  services: ServiceRecord[];
  payments: PaymentRecord[];
  providers: ProviderAccount[];
}

export class FileGuestRepository implements GuestRepository {
  private queue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  ready(): boolean {
    return true;
  }

  supportsProviderAccounts(): boolean {
    return false;
  }

  async createConsultation(record: ConsultationRecord): Promise<void> {
    await this.update((store) => {
      store.consultations.push(record);
    });
  }

  async createOrder(record: ServiceOrderRecord): Promise<void> {
    await this.update((store) => {
      store.orders.push(record);
    });
  }

  async saveConfirmation(record: ConfirmationRecord): Promise<void> {
    await this.update((store) => {
      store.confirmations.push(record);
    });
  }

  async confirmationStatus(reference: string): Promise<{ email: ConfirmationChannelStatus; sms: ConfirmationChannelStatus }> {
    const store = await this.read();
    return {
      email: FileGuestRepository.latest(store, reference, 'email'),
      sms: FileGuestRepository.latest(store, reference, 'sms'),
    };
  }

  async findConsultation(reference: string): Promise<ConsultationRecord | null> {
    const store = await this.read();
    return store.consultations.find((item) => item.reference === reference) ?? null;
  }

  async findOrder(reference: string): Promise<ServiceOrderRecord | null> {
    const store = await this.read();
    return store.orders.find((item) => item.reference === reference) ?? null;
  }

  async referenceExists(reference: string): Promise<boolean> {
    const store = await this.read();
    return store.consultations.some((item) => item.reference === reference)
      || store.orders.some((item) => item.reference === reference);
  }

  async listConsultations(): Promise<ConsultationRecord[]> {
    const store = await this.read();
    return [...store.consultations].reverse();
  }

  async listOrders(): Promise<ServiceOrderRecord[]> {
    const store = await this.read();
    return [...store.orders].reverse();
  }

  async listServices(): Promise<ServiceRecord[]> {
    const store = await this.read();
    return store.services;
  }

  async saveService(service: ServiceRecord): Promise<void> {
    await this.update((store) => {
      store.services.push(service);
    });
  }

  async updateServiceRate(id: string, baseRateCents: number): Promise<boolean> {
    let updated = false;
    await this.update((store) => {
      const service = store.services.find((item) => item.id === id);
      if (!service) return;
      service.baseRateCents = baseRateCents;
      updated = true;
    });
    return updated;
  }

  async listProviders(): Promise<ProviderAccount[]> {
    const store = await this.read();
    return store.providers;
  }

  async providerAccount(userId: string): Promise<ProviderAccount | null> {
    const store = await this.read();
    return store.providers.find((item) => item.id === userId) ?? null;
  }

  async saveProviderAccount(): Promise<boolean> {
    return false;
  }

  async assignOrder(reference: string, providerUserId: string, updatedAt: string): Promise<boolean> {
    let updated = false;
    await this.update((store) => {
      const order = store.orders.find((item) => item.reference === reference);
      if (!order) return;
      order.assignedProviderUserId = providerUserId;
      order.status = 'assigned';
      order.updatedAt = updatedAt;
      updated = true;
    });
    return updated;
  }

  async updateOrderStatus(reference: string, status: InquiryStatus, actorProviderId: string | null, updatedAt: string): Promise<boolean> {
    let updated = false;
    await this.update((store) => {
      const order = store.orders.find((item) => item.reference === reference);
      if (!order) return;
      if (actorProviderId && order.assignedProviderUserId !== actorProviderId) return;
      order.status = status;
      order.updatedAt = updatedAt;
      updated = true;
    });
    return updated;
  }

  async closeConsultation(reference: string): Promise<boolean> {
    let updated = false;
    await this.update((store) => {
      const consultation = store.consultations.find((item) => item.reference === reference);
      if (!consultation) return;
      consultation.status = 'closed';
      updated = true;
    });
    return updated;
  }

  async markOrderPaid(reference: string, payment: PaymentRecord, updatedAt: string): Promise<boolean> {
    let updated = false;
    await this.update((store) => {
      const order = store.orders.find((item) => item.reference === reference);
      if (!order) return;
      order.paymentStatus = 'paid';
      order.paymentIntentId = payment.id;
      order.updatedAt = updatedAt;
      if (!store.payments.some((item) => item.id === payment.id)) store.payments.push(payment);
      updated = true;
    });
    return updated;
  }

  private static latest(store: StoreFile, reference: string, channel: 'email' | 'sms'): ConfirmationChannelStatus {
    const rows = store.confirmations.filter((item) => item.reference === reference && item.channel === channel);
    return rows.length === 0 ? 'skipped' : rows[rows.length - 1].status;
  }

  private async update(change: (store: StoreFile) => void): Promise<void> {
    const run = this.queue.then(async () => {
      const store = await this.read();
      change(store);
      await this.write(store);
    });
    this.queue = run.then(() => undefined, () => undefined);
    return run;
  }

  private async read(): Promise<StoreFile> {
    try {
      const text = await readFile(this.filePath, 'utf8');
      const parsed = JSON.parse(text) as Partial<StoreFile>;
      return {
        consultations: parsed.consultations ?? [],
        orders: parsed.orders ?? [],
        confirmations: parsed.confirmations ?? [],
        services: parsed.services ?? [],
        payments: parsed.payments ?? [],
        providers: parsed.providers ?? [],
      };
    } catch {
      return { consultations: [], orders: [], confirmations: [], services: [], payments: [], providers: [] };
    }
  }

  private async write(store: StoreFile): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, JSON.stringify(store), 'utf8');
  }
}
