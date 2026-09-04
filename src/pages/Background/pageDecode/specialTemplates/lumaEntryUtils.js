/** Luma get-events: approval status moved from role to guest_info; support both shapes. */

export function getEntryApprovalStatus(entry) {
  if (entry?.guest_info?.approval_status != null) {
    return entry.guest_info.approval_status;
  }
  return entry?.role?.approval_status;
}

export function isEntryApproved(entry, approvedValue = 'approved') {
  return getEntryApprovalStatus(entry) === approvedValue;
}

export function getEntryApprovalStatusJsonPath(entryIdx, entry) {
  if (entry?.guest_info?.approval_status != null) {
    return `$.entries[${entryIdx}].guest_info.approval_status`;
  }
  return `$.entries[${entryIdx}].role.approval_status`;
}
