import { InquiryStatus } from '../types/entities';

export class VisitStatus {
  static label(status: string): string {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'reviewing':
        return 'In review';
      case 'assigned':
        return 'Assigned';
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In progress';
      case 'completed':
        return 'Complete';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Updated';
    }
  }

  static nextProviderAction(status: InquiryStatus): { status: InquiryStatus; label: string } | null {
    if (status === 'assigned' || status === 'scheduled') {
      return { status: 'in_progress', label: 'Start visit' };
    }
    if (status === 'in_progress') {
      return { status: 'completed', label: 'Mark visit complete' };
    }
    return null;
  }
}
