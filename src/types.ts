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
  owner: string;
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
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  email: string;
}
