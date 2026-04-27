export type Shift = 'AM' | 'PM' | 'Night';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type Status = 'Open' | 'In Progress' | 'Pending' | 'Resolved';

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface DutyLog {
  id: string;
  case_id: string;
  created_at: any; // Firestore Timestamp
  shift: Shift;
  room_number: string;
  guest_name: string;
  issue_type: string;
  priority: Priority;
  description: string;
  action_taken: string;
  follow_up_action?: string;
  handover_to?: string;
  owner: string;
  owner_id?: string;
  department?: Department;
  status: Status;
  follow_up_required: boolean;
  resolved_at?: any;
  attachments?: Attachment[];
}

export interface HandoverNote {
  id: string;
  date: string;
  from_shift: Shift;
  to_shift: Shift;
  notes: string;
  unresolved_case_ids: string[];
  department?: Department;
}

export interface ShiftChecklist {
  id: string;
  task_name: string;
  category: string;
  shift: Shift;
  required: boolean;
  completed: boolean;
  completed_by?: string;
  completed_at?: any;
  department?: Department;
}

export type PlatformRole = 'Admin' | 'Duty Manager' | 'Department Lead' | 'Staff' | 'Viewer';
export type Department = 'Front Office' | 'Housekeeping' | 'Maintenance' | 'Security' | 'Management' | 'Food & Beverage';

export interface PermissionFlags {
  view_all_cases: boolean;
  view_department_cases: boolean;
  create_cases: boolean;
  edit_own_cases: boolean;
  edit_all_cases: boolean;
  resolve_cases: boolean;
  assign_cases: boolean;
  submit_handover: boolean;
  complete_checklist: boolean;
  manage_staff: boolean;
  manage_checklists: boolean;
  view_audit_logs: boolean;
  manage_settings: boolean;
}

export interface Staff {
  id: string;
  name: string;
  role: PlatformRole;
  department: Department;
  email: string;
  permissions: PermissionFlags;
  two_factor_enabled?: boolean;
  created_at: any;
}

export interface AuditLog {
  id: string;
  target_id: string;
  collection: string;
  changed_by: string;
  timestamp: any;
  changes: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  action: 'create' | 'update' | 'delete';
}
