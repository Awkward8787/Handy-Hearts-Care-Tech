import { PublicConfig } from './publicConfig';
import { PriceItem } from '../types/entities';
import { Receipt } from '../types/guest';

export interface QuoteResponse {
  priced: boolean;
  items: PriceItem[];
  totalCents: number;
  serviceId: string | null;
}

export interface PublicService {
  id: string;
  name: string;
  description: string;
  baseRateCents: number;
  minHours: number;
}

export interface OrderResponse {
  receipt: Receipt;
  clientSecret: string | null;
}

export class ApiClient {
  static async services(): Promise<PublicService[]> {
    const payload = await ApiClient.send<{ services: PublicService[] }>('/api/services');
    return payload.services;
  }

  static quote(body: unknown): Promise<QuoteResponse> {
    return ApiClient.send<QuoteResponse>('/api/quotes', { method: 'POST', body });
  }

  static createConsultation(body: unknown): Promise<{ receipt: Receipt }> {
    return ApiClient.send<{ receipt: Receipt }>('/api/consultations', { method: 'POST', body });
  }

  static createOrder(body: unknown): Promise<OrderResponse> {
    return ApiClient.send<OrderResponse>('/api/orders', { method: 'POST', body });
  }

  static receipt(reference: string): Promise<{ receipt: Receipt }> {
    return ApiClient.send<{ receipt: Receipt }>(`/api/receipts/${encodeURIComponent(reference)}`);
  }

  static staff<T>(path: string, token: string, options?: { method?: string; body?: unknown }): Promise<T> {
    return ApiClient.send<T>(path, {
      method: options?.method ?? 'GET',
      body: options?.body,
      token,
    });
  }

  private static async send<T>(path: string, options?: { method?: string; body?: unknown; token?: string }): Promise<T> {
    let response: Response;
    try {
      response = await fetch(`${PublicConfig.apiBaseUrl()}${path}`, {
        method: options?.method ?? 'GET',
        headers: {
          ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
          ...(options?.token ? { Authorization: `Bearer ${options.token}` } : {}),
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
      });
    } catch {
      throw new Error("HandyHearts can't reach the service right now. Please try again later.");
    }
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const record = payload && typeof payload === 'object' ? payload as { error?: { message?: unknown } } : null;
      const message = typeof record?.error?.message === 'string'
        ? record.error.message
        : 'That request could not be completed. Please try again.';
      throw new Error(message);
    }
    return payload as T;
  }
}
