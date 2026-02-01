
export enum UserRole {
  FAMILY = 'FAMILY',
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_approved?: boolean;
  is_banned?: boolean;
  phone_e164?: string;
}

export type InquiryStatus = 'new' | 'in_review' | 'assigned' | 'closed';

export interface InquirySubmission {
  id: string;
  user_id: string;
  role_snapshot: string;
  full_name: string;
  phone_e164: string;
  email: string;
  service_requested: string;
  preferred_date: string | null;
  notes: string | null;
  status: InquiryStatus;
  assigned_provider_user_id: string | null;
  total_price_cents?: number;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 
  | 'PENDING_QUOTE' 
  | 'PENDING_PAYMENT' 
  | 'PAID' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface Service {
  id: string;
  name: string;
  description: string;
  base_rate_cents: number;
  min_hours: number;
}

export interface ServiceType {
  name: string;
  baseRate: number;
  minHours: number;
}

export interface PriceItem {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  items: PriceItem[];
  total: number;
}

export interface Booking {
  id: string;
  family_id: string;
  provider_id?: string;
  service_id: string;
  status: BookingStatus;
  scheduled_at: string;
  duration_hours: number;
  address_text: string;
  notes?: string;
  price_breakdown: PriceBreakdown;
  total_amount_cents: number;
  created_at: string;
}

export interface MonitoringNote {
  id: string;
  priority: 'CRITICAL' | 'NORMAL';
  content: string;
  author_id: string;
  created_at: string;
  app_user?: {
    name: string;
  };
}
