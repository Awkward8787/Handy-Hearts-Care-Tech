import { UserRole } from '../types/entities';

export type PortalName =
  | 'admin'
  | 'provider'
  | 'banned'
  | 'provider-pending'
  | 'staff-inactive'
  | 'not-staff';

export interface GateUser {
  role: UserRole;
  is_approved?: boolean;
  is_banned?: boolean;
}

export class RoleGate {
  static portalFor(user: GateUser): PortalName {
    if (user.is_banned) return 'banned';
    if (user.role === UserRole.ADMIN) {
      return user.is_approved === false ? 'staff-inactive' : 'admin';
    }
    if (user.role === UserRole.PROVIDER) {
      return user.is_approved ? 'provider' : 'provider-pending';
    }
    return 'not-staff';
  }

  static canManagePlatform(user: GateUser): boolean {
    return RoleGate.portalFor(user) === 'admin';
  }

  static canViewAssignedJobs(user: GateUser): boolean {
    return RoleGate.portalFor(user) === 'provider';
  }
}
