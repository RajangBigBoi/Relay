import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface AuditChange {
  field: string;
  old_value: any;
  new_value: any;
}

export async function recordAuditLog(
  target_id: string,
  collectionName: string,
  action: 'create' | 'update' | 'delete',
  changes: AuditChange[] = []
) {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      target_id,
      collection: collectionName,
      changed_by: auth.currentUser?.email || 'System',
      timestamp: serverTimestamp(),
      action,
      changes
    });
  } catch (error) {
    console.error("Failed to record audit log:", error);
    // Non-blocking, so we don't throw
  }
}
