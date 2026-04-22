# Security Specification - Relay Hotel Operations

## Data Invariants
1. A Duty Log must have a valid Case ID (RLY-XXXXX).
2. A Duty Log must belong to a valid shift (AM, PM, Night).
3. Critical issues must be visible to all authenticated staff.
4. Handover notes are immutable once created (for audit trail).
5. Staff members can only be read by other staff members.

## The "Dirty Dozen" Payloads (Attacker Payloads)
1. **Case ID Poisoning**: Create log with 2MB string as case ID.
2. **Identity Spoofing**: Create log setting `owner` to someone else's UID.
3. **Privilege Escalation**: Update `staff` profile to set `role: "Admin"`.
4. **State Shortcutting**: Update log status from `Open` directly to `Resolved` without adding `action_taken`.
5. **Orphaned Write**: Create handover note referencing non-existent case IDs.
6. **Denial of Wallet**: Create thousands of empty logs per second.
7. **PII Leak**: Read `staff` private emails without being verified.
8. **Immutable Field Tampering**: Update `created_at` on an existing log.
9. **Role Injection**: Create a staff member with a "System" role.
10. **Cross-Shift Modification**: PM shift user updating an AM shift log's `created_at`.
11. **Shadow Update**: Update log with hidden `is_deleted: true` field.
12. **Unverified Access**: Attempt write with `email_verified: false`.

## Test Runner (Logic Verification)
The following tests verify that the above payloads are correctly rejected.
(See firestore.rules.test.ts)
