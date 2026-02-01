
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
  provider_data?: {
    stripeAccountId?: string;
    onboardingComplete?: boolean;
    backgroundCheckStatus?: 'pending' | 'passed' | 'failed';
    rating?: number;
    bio?: string;
  };
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

export interface DeviceDetail {
  deviceType: string;
  brand: string;
  model: string;
  issueDescription: string;
}

export interface InquirySubmission {
  id: string;
  user_id: string;
  full_name: string;
  phone_e164: string;
  email: string;
  service_category: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  devices: DeviceDetail[];
  senior_info: {
    name: string;
    comfortLevel: 'beginner' | 'intermediate' | 'advanced';
    accessibilityNeeds: string[];
  };
  scheduling: {
    serviceType: 'in_home' | 'remote' | 'either';
    preferredDate: string;
    preferredTime: string;
    address?: string;
  };
  notes: string | null;
  status: InquiryStatus;
  assigned_provider_user_id: string | null;
  total_price_cents: number;
  provider_payout_cents: number;
  platform_fee_cents: number;
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

// Added PriceItem interface to fix missing import in pricingEngine.ts
export interface PriceItem {
  label: string;
  amount: number;
}

// Updated PriceBreakdown to use the PriceItem interface
export interface PriceBreakdown {
  items: PriceItem[];
  total: number;
}

// Added ServiceType to match the expected shape in PricingEngine
export interface ServiceType {
  name: string;
  baseRate: number;
  minHours: number;
}

// Added Booking interface to resolve missing import in AdminPortal.tsx
export interface Booking {
  id: string;
  total_amount_cents: number;
  created_at: string;
  status: string;
}
