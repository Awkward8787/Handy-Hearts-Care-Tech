export enum UserRole {
  PROVIDER = 'PROVIDER',
  ADMIN = 'ADMIN',
}

export interface ProviderData {
  stripeAccountId?: string;
  onboardingComplete?: boolean;
  backgroundCheckStatus?: 'pending' | 'passed' | 'failed';
  rating?: number;
  bio?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_approved?: boolean;
  is_banned?: boolean;
  phone_e164?: string;
  provider_data?: ProviderData;
}

export type InquiryStatus =
  | 'draft'
  | 'submitted'
  | 'reviewing'
  | 'assigned'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type Urgency = 'low' | 'medium' | 'high' | 'emergency';

export type ComfortLevel = 'beginner' | 'intermediate' | 'advanced';

export type ServiceVisitType = 'in_home' | 'remote' | 'either';

export type PreferredTime = 'anytime' | 'morning' | 'afternoon' | 'evening';

export interface DeviceDetail {
  deviceType: string;
  brand: string;
  model: string;
  issueDescription: string;
}

export interface SeniorInfo {
  name: string;
  comfortLevel: ComfortLevel;
  accessibilityNeeds: string[];
}

export interface SchedulingInfo {
  serviceType: ServiceVisitType;
  preferredDate: string;
  preferredTime: string;
  address?: string;
}

export interface InquirySubmission {
  id: string;
  user_id: string;
  full_name: string;
  phone_e164: string;
  email: string;
  service_category: string;
  urgency: Urgency;
  devices: DeviceDetail[];
  senior_info: SeniorInfo;
  scheduling: SchedulingInfo;
  notes: string | null;
  status: InquiryStatus;
  assigned_provider_user_id: string | null;
  total_price_cents: number;
  provider_payout_cents: number;
  platform_fee_cents: number;
  payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  base_rate_cents: number;
  min_hours: number;
  is_active: boolean;
}

export interface PriceItem {
  label: string;
  amount: number;
}

export interface PriceBreakdown {
  items: PriceItem[];
  total: number;
}

export interface ServiceType {
  name: string;
  baseRate: number;
  minHours: number;
}

export interface Booking {
  id: string;
  total_amount_cents: number;
  created_at: string;
  status: string;
}

export interface MonitoringNote {
  id: string;
  priority: string;
  content: string;
  created_at: string;
}

export interface AppUserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  is_approved: boolean;
  is_banned: boolean;
  phone_e164: string | null;
}
