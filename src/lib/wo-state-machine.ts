// ────────────────────────────────────────────────────────
// WO State Machine — FMSP Lintasarta
// Central state machine for Work Order status transitions
// ────────────────────────────────────────────────────────

export type WoStatus =
  | "draft"
  | "pending_approval"
  | "approved_l1"
  | "pending_l2"
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "resolved"
  | "verified"
  | "reopened"
  | "rejected"
  | "closed";

export const WO_STATUS_LABELS: Record<WoStatus, string> = {
  draft: "Draft",
  pending_approval: "Menunggu Approval",
  approved_l1: "Disetujui L1",
  pending_l2: "Menunggu Approval L2",
  assigned: "Ditugaskan",
  in_progress: "Sedang Dikerjakan",
  on_hold: "Ditunda",
  resolved: "Selesai (Belum Diverifikasi)",
  verified: "Diverifikasi",
  reopened: "Dibuka Kembali",
  rejected: "Ditolak",
  closed: "Ditutup",
};

export const WO_STATUS_COLORS: Record<WoStatus, { text: string; bg: string; border: string }> = {
  draft:            { text: "text-zinc-400",   bg: "bg-zinc-500/10",   border: "border-zinc-500/20" },
  pending_approval: { text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20" },
  approved_l1:      { text: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  pending_l2:       { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  assigned:         { text: "text-cyan-400",   bg: "bg-cyan-500/10",   border: "border-cyan-500/20" },
  in_progress:      { text: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20" },
  on_hold:          { text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  resolved:         { text: "text-emerald-400",bg: "bg-emerald-500/10",border: "border-emerald-500/20" },
  verified:         { text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/20" },
  reopened:         { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  rejected:         { text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/20" },
  closed:           { text: "text-zinc-500",   bg: "bg-zinc-600/10",   border: "border-zinc-600/20" },
};

/**
 * Valid state transitions.
 * Each key is a current status, value is array of allowed next statuses.
 */
const TRANSITIONS: Record<WoStatus, WoStatus[]> = {
  draft:            ["pending_approval"],
  pending_approval: ["approved_l1", "rejected"],
  approved_l1:      ["pending_l2", "assigned"],
  pending_l2:       ["assigned", "rejected"],
  assigned:         ["in_progress"],
  in_progress:      ["on_hold", "resolved"],
  on_hold:          ["in_progress"],
  resolved:         ["verified", "reopened"],
  verified:         ["closed"],
  reopened:         ["assigned"],
  rejected:         ["closed"],
  closed:           [],
};

/**
 * Check if a transition from `from` to `to` is valid.
 */
export function canTransition(from: string, to: string): boolean {
  const allowed = TRANSITIONS[from as WoStatus];
  if (!allowed) return false;
  return allowed.includes(to as WoStatus);
}

/**
 * Get the list of valid next statuses from a given status.
 */
export function getNextStates(from: string): WoStatus[] {
  return TRANSITIONS[from as WoStatus] || [];
}

/**
 * Validate a status transition and return error message if invalid.
 */
export function validateTransition(
  currentStatus: string,
  newStatus: string,
): { valid: boolean; error?: string } {
  if (!TRANSITIONS[currentStatus as WoStatus]) {
    return { valid: false, error: `Status "${currentStatus}" tidak dikenal.` };
  }
  if (!canTransition(currentStatus, newStatus)) {
    const allowed = getNextStates(currentStatus);
    return {
      valid: false,
      error: `Transisi dari "${currentStatus}" ke "${newStatus}" tidak diizinkan. Status berikutnya yang valid: ${allowed.join(", ") || "(terminal)"}`,
    };
  }
  return { valid: true };
}

/**
 * Check if a status is a terminal state (no further transitions).
 */
export function isTerminal(status: string): boolean {
  const next = TRANSITIONS[status as WoStatus];
  return !next || next.length === 0;
}

/**
 * Check if a WO needs L2 approval based on config.
 */
export function needsL2Approval(
  priority: string,
  l2Priorities: string[],
  requireL2: boolean,
): boolean {
  if (!requireL2) return false;
  return l2Priorities.includes(priority);
}

/**
 * Determine the next status after L1 approval.
 */
export function statusAfterL1(
  priority: string,
  requireL2: boolean,
  l2Priorities: string[],
): WoStatus {
  if (needsL2Approval(priority, l2Priorities, requireL2)) {
    return "pending_l2";
  }
  return "assigned";
}

/**
 * All non-terminal statuses (for filtering active WOs).
 */
export const ACTIVE_STATUSES: WoStatus[] = [
  "draft",
  "pending_approval",
  "approved_l1",
  "pending_l2",
  "assigned",
  "in_progress",
  "on_hold",
  "resolved",
  "reopened",
];

/**
 * Statuses that count as "completed".
 */
export const COMPLETED_STATUSES: WoStatus[] = ["verified", "closed"];
