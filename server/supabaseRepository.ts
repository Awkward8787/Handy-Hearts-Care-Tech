import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

export class SupabaseGuestRepository implements GuestRepository {
  private readonly client: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.client = createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  ready(): boolean {
    return true;
  }

  supportsProviderAccounts(): boolean {
    return true;
  }

  async createConsultation(record: ConsultationRecord): Promise<void> {
    const { error } = await this.client.from('consultation_request').insert(SupabaseGuestRepository.consultationToRow(record));
    if (error) throw new Error('STORE_WRITE_FAILED');
  }

  async createOrder(record: ServiceOrderRecord): Promise<void> {
    const { error } = await this.client.from('service_order').insert(SupabaseGuestRepository.orderToRow(record));
    if (error) throw new Error('STORE_WRITE_FAILED');
  }

  async saveConfirmation(record: ConfirmationRecord): Promise<void> {
    const { error } = await this.client.from('confirmation_message').insert({
      reference: record.reference,
      channel: record.channel,
      destination: record.destination,
      subject: record.subject,
      body: record.body,
      status: record.status,
      created_at: record.createdAt,
    });
    if (error) throw new Error('STORE_WRITE_FAILED');
  }

  async confirmationStatus(reference: string): Promise<{ email: ConfirmationChannelStatus; sms: ConfirmationChannelStatus }> {
    const { data, error } = await this.client.from('confirmation_message').select('channel,status,created_at').eq('reference', reference).order('created_at');
    if (error) throw new Error('STORE_READ_FAILED');
    const rows = Array.isArray(data) ? data : [];
    return {
      email: SupabaseGuestRepository.latest(rows, 'email'),
      sms: SupabaseGuestRepository.latest(rows, 'sms'),
    };
  }

  async findConsultation(reference: string): Promise<ConsultationRecord | null> {
    const { data, error } = await this.client.from('consultation_request').select('*').eq('reference', reference).maybeSingle();
    if (error) throw new Error('STORE_READ_FAILED');
    return data ? SupabaseGuestRepository.consultationFromRow(data) : null;
  }

  async findOrder(reference: string): Promise<ServiceOrderRecord | null> {
    const { data, error } = await this.client.from('service_order').select('*').eq('reference', reference).maybeSingle();
    if (error) throw new Error('STORE_READ_FAILED');
    return data ? SupabaseGuestRepository.orderFromRow(data) : null;
  }

  async referenceExists(reference: string): Promise<boolean> {
    const [consultation, order] = await Promise.all([this.findConsultation(reference), this.findOrder(reference)]);
    return Boolean(consultation || order);
  }

  async listConsultations(): Promise<ConsultationRecord[]> {
    const { data, error } = await this.client.from('consultation_request').select('*').order('created_at', { ascending: false });
    if (error) throw new Error('STORE_READ_FAILED');
    return (data ?? []).map((row) => SupabaseGuestRepository.consultationFromRow(row));
  }

  async listOrders(): Promise<ServiceOrderRecord[]> {
    const { data, error } = await this.client.from('service_order').select('*').order('created_at', { ascending: false });
    if (error) throw new Error('STORE_READ_FAILED');
    return (data ?? []).map((row) => SupabaseGuestRepository.orderFromRow(row));
  }

  async listServices(): Promise<ServiceRecord[]> {
    const { data, error } = await this.client.from('services').select('*').order('name');
    if (error) throw new Error('STORE_READ_FAILED');
    return (data ?? []).map((row) => SupabaseGuestRepository.serviceFromRow(row));
  }

  async saveService(service: ServiceRecord): Promise<void> {
    const { error } = await this.client.from('services').insert({
      id: service.id,
      name: service.name,
      description: service.description,
      base_rate_cents: service.baseRateCents,
      min_hours: service.minHours,
      is_active: service.isActive,
    });
    if (error) throw new Error('STORE_WRITE_FAILED');
  }

  async updateServiceRate(id: string, baseRateCents: number): Promise<boolean> {
    const { data, error } = await this.client.from('services').update({ base_rate_cents: baseRateCents }).eq('id', id).select('id');
    if (error) throw new Error('STORE_WRITE_FAILED');
    return Array.isArray(data) && data.length > 0;
  }

  async listProviders(): Promise<ProviderAccount[]> {
    const { data, error } = await this.client.from('app_user').select('id,name,email,provider_data,is_approved,is_banned,role').eq('role', 'PROVIDER').eq('is_approved', true).eq('is_banned', false);
    if (error) throw new Error('STORE_READ_FAILED');
    return (data ?? []).map((row) => SupabaseGuestRepository.providerFromRow(row));
  }

  async providerAccount(userId: string): Promise<ProviderAccount | null> {
    const { data, error } = await this.client.from('app_user').select('id,name,email,provider_data').eq('id', userId).maybeSingle();
    if (error) throw new Error('STORE_READ_FAILED');
    return data ? SupabaseGuestRepository.providerFromRow(data) : null;
  }

  async saveProviderAccount(userId: string, stripeAccountId: string): Promise<boolean> {
    const current = await this.providerAccount(userId);
    const providerData = { stripeAccountId, onboardingComplete: false };
    const { data, error } = await this.client.from('app_user').update({ provider_data: current ? { ...providerData } : providerData }).eq('id', userId).select('id');
    if (error) throw new Error('STORE_WRITE_FAILED');
    return Array.isArray(data) && data.length > 0;
  }

  async assignOrder(reference: string, providerUserId: string, updatedAt: string): Promise<boolean> {
    const { data, error } = await this.client.from('service_order').update({
      assigned_provider_user_id: providerUserId,
      status: 'assigned',
      updated_at: updatedAt,
    }).eq('reference', reference).select('reference');
    if (error) throw new Error('STORE_WRITE_FAILED');
    return Array.isArray(data) && data.length > 0;
  }

  async updateOrderStatus(reference: string, status: InquiryStatus, actorProviderId: string | null, updatedAt: string): Promise<boolean> {
    let query = this.client.from('service_order').update({ status, updated_at: updatedAt }).eq('reference', reference);
    if (actorProviderId) query = query.eq('assigned_provider_user_id', actorProviderId);
    const { data, error } = await query.select('reference');
    if (error) throw new Error('STORE_WRITE_FAILED');
    return Array.isArray(data) && data.length > 0;
  }

  async closeConsultation(reference: string): Promise<boolean> {
    const { data, error } = await this.client.from('consultation_request').update({ status: 'closed' }).eq('reference', reference).select('reference');
    if (error) throw new Error('STORE_WRITE_FAILED');
    return Array.isArray(data) && data.length > 0;
  }

  async markOrderPaid(reference: string, payment: PaymentRecord, updatedAt: string): Promise<boolean> {
    const { error: paymentError } = await this.client.from('payment').upsert({
      id: payment.id,
      reference: payment.reference,
      amount_cents: payment.amountCents,
      status: payment.status,
      created_at: payment.createdAt,
    });
    if (paymentError) throw new Error('STORE_WRITE_FAILED');
    const { data, error } = await this.client.from('service_order').update({
      payment_status: 'paid',
      payment_intent_id: payment.id,
      updated_at: updatedAt,
    }).eq('reference', reference).select('reference');
    if (error) throw new Error('STORE_WRITE_FAILED');
    return Array.isArray(data) && data.length > 0;
  }

  private static latest(rows: unknown[], channel: 'email' | 'sms'): ConfirmationChannelStatus {
    const match = [...rows].reverse().find((row) => SupabaseGuestRepository.text((row as { channel?: unknown }).channel) === channel);
    const status = SupabaseGuestRepository.text((match as { status?: unknown } | undefined)?.status);
    if (status === 'sent' || status === 'queued' || status === 'failed') return status;
    return 'skipped';
  }

  private static consultationToRow(record: ConsultationRecord): Record<string, unknown> {
    return {
      reference: record.reference,
      full_name: record.fullName,
      email: record.email,
      phone_e164: record.phone,
      topic: record.topic,
      preferred_date: record.preferredDate,
      preferred_time: record.preferredTime,
      notes: record.notes,
      status: record.status,
      created_at: record.createdAt,
    };
  }

  private static consultationFromRow(row: unknown): ConsultationRecord {
    const record = SupabaseGuestRepository.asRecord(row);
    return {
      reference: SupabaseGuestRepository.text(record.reference),
      fullName: SupabaseGuestRepository.text(record.full_name),
      email: SupabaseGuestRepository.nullableText(record.email),
      phone: SupabaseGuestRepository.nullableText(record.phone_e164),
      topic: SupabaseGuestRepository.text(record.topic),
      preferredDate: SupabaseGuestRepository.text(record.preferred_date),
      preferredTime: SupabaseGuestRepository.time(record.preferred_time),
      notes: SupabaseGuestRepository.nullableText(record.notes),
      status: record.status === 'closed' ? 'closed' : 'submitted',
      createdAt: SupabaseGuestRepository.text(record.created_at),
    };
  }

  private static orderToRow(record: ServiceOrderRecord): Record<string, unknown> {
    return {
      reference: record.reference,
      full_name: record.fullName,
      email: record.email,
      phone_e164: record.phone,
      service_category: record.serviceCategory,
      service_id: record.serviceId,
      urgency: record.urgency,
      preferred_date: record.preferredDate,
      preferred_time: record.preferredTime,
      service_type: record.serviceType,
      address: record.address,
      notes: record.notes,
      total_price_cents: record.totalPriceCents,
      price_items: record.priceItems,
      provider_payout_cents: record.providerPayoutCents,
      platform_fee_cents: record.platformFeeCents,
      payment_intent_id: record.paymentIntentId,
      payment_status: record.paymentStatus,
      status: record.status,
      assigned_provider_user_id: record.assignedProviderUserId,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    };
  }

  private static orderFromRow(row: unknown): ServiceOrderRecord {
    const record = SupabaseGuestRepository.asRecord(row);
    const items = Array.isArray(record.price_items) ? record.price_items : [];
    return {
      reference: SupabaseGuestRepository.text(record.reference),
      fullName: SupabaseGuestRepository.text(record.full_name),
      email: SupabaseGuestRepository.nullableText(record.email),
      phone: SupabaseGuestRepository.nullableText(record.phone_e164),
      serviceCategory: SupabaseGuestRepository.text(record.service_category),
      serviceId: SupabaseGuestRepository.nullableText(record.service_id),
      urgency: SupabaseGuestRepository.urgency(record.urgency),
      preferredDate: SupabaseGuestRepository.text(record.preferred_date),
      preferredTime: SupabaseGuestRepository.time(record.preferred_time),
      serviceType: record.service_type === 'in_home' ? 'in_home' : 'remote',
      address: SupabaseGuestRepository.nullableText(record.address),
      notes: SupabaseGuestRepository.nullableText(record.notes),
      totalPriceCents: SupabaseGuestRepository.number(record.total_price_cents),
      priceItems: items.map((item) => {
        const price = SupabaseGuestRepository.asRecord(item);
        return { label: SupabaseGuestRepository.text(price.label), amount: SupabaseGuestRepository.number(price.amount) };
      }),
      providerPayoutCents: SupabaseGuestRepository.number(record.provider_payout_cents),
      platformFeeCents: SupabaseGuestRepository.number(record.platform_fee_cents),
      paymentIntentId: SupabaseGuestRepository.nullableText(record.payment_intent_id),
      paymentStatus: record.payment_status === 'paid' || record.payment_status === 'unpaid' ? record.payment_status : 'not_due',
      status: SupabaseGuestRepository.orderStatus(record.status),
      assignedProviderUserId: SupabaseGuestRepository.nullableText(record.assigned_provider_user_id),
      createdAt: SupabaseGuestRepository.text(record.created_at),
      updatedAt: SupabaseGuestRepository.text(record.updated_at),
    };
  }

  private static serviceFromRow(row: unknown): ServiceRecord {
    const record = SupabaseGuestRepository.asRecord(row);
    return {
      id: SupabaseGuestRepository.text(record.id),
      name: SupabaseGuestRepository.text(record.name),
      description: SupabaseGuestRepository.text(record.description),
      baseRateCents: SupabaseGuestRepository.number(record.base_rate_cents),
      minHours: SupabaseGuestRepository.number(record.min_hours),
      isActive: Boolean(record.is_active),
    };
  }

  private static providerFromRow(row: unknown): ProviderAccount {
    const record = SupabaseGuestRepository.asRecord(row);
    const data = SupabaseGuestRepository.asRecord(record.provider_data);
    return {
      id: SupabaseGuestRepository.text(record.id),
      name: SupabaseGuestRepository.text(record.name),
      email: SupabaseGuestRepository.text(record.email),
      stripeAccountId: SupabaseGuestRepository.nullableText(data.stripeAccountId),
    };
  }

  private static asRecord(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private static text(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private static nullableText(value: unknown): string | null {
    return typeof value === 'string' && value ? value : null;
  }

  private static number(value: unknown): number {
    return typeof value === 'number' ? value : Number(value) || 0;
  }

  private static time(value: unknown): ConsultationRecord['preferredTime'] {
    if (value === 'morning' || value === 'afternoon' || value === 'evening' || value === 'anytime') return value;
    return 'anytime';
  }

  private static urgency(value: unknown): ServiceOrderRecord['urgency'] {
    if (value === 'low' || value === 'medium' || value === 'high' || value === 'emergency') return value;
    return 'low';
  }

  private static orderStatus(value: unknown): InquiryStatus {
    if (
      value === 'draft' || value === 'submitted' || value === 'reviewing' || value === 'assigned'
      || value === 'scheduled' || value === 'in_progress' || value === 'completed' || value === 'cancelled'
    ) return value;
    return 'submitted';
  }
}
