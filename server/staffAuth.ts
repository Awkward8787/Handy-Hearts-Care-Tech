import { createClient } from '@supabase/supabase-js';
import { UserRole } from '../types/entities';

export interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isApproved: boolean;
  isBanned: boolean;
}

export interface StaffAuthenticator {
  ready(): boolean;
  verify(authorization: string | undefined): Promise<StaffUser | null>;
}

export class SupabaseStaffAuth implements StaffAuthenticator {
  constructor(
    private readonly url: string | undefined,
    private readonly anonKey: string | undefined,
    private readonly serviceRoleKey: string | undefined,
  ) {}

  ready(): boolean {
    return Boolean(this.url && this.anonKey && this.serviceRoleKey);
  }

  async verify(authorization: string | undefined): Promise<StaffUser | null> {
    if (!this.ready() || !this.url || !this.anonKey || !this.serviceRoleKey) return null;
    const token = SupabaseStaffAuth.token(authorization);
    if (!token) return null;
    const anon = createClient(this.url, this.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await anon.auth.getUser(token);
    if (error || !data.user) return null;
    const admin = createClient(this.url, this.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: row, error: rowError } = await admin.from('app_user').select('id,email,name,role,is_approved,is_banned').eq('id', data.user.id).maybeSingle();
    if (rowError || !row) return null;
    if (row.role !== UserRole.ADMIN && row.role !== UserRole.PROVIDER) return null;
    return {
      id: row.id,
      email: row.email ?? data.user.email ?? '',
      name: row.name ?? 'Staff',
      role: row.role,
      isApproved: Boolean(row.is_approved),
      isBanned: Boolean(row.is_banned),
    };
  }

  private static token(authorization: string | undefined): string {
    if (!authorization?.startsWith('Bearer ')) return '';
    return authorization.slice('Bearer '.length).trim();
  }
}
