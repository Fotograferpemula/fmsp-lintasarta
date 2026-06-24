// ────────────────────────────────────────────────────────
// RBAC Configuration — FMSP Lintasarta
// 6-tier hierarchical role-based access control
// ────────────────────────────────────────────────────────

export type RoleName =
  | "superadmin"
  | "manager_fms"
  | "admin_pusat"
  | "admin_regional"
  | "admin_lokasi"
  | "user";

export interface RoleConfig {
  level: number;
  label: string;
  color: string;
  bgColor: string;
  description: string;
}

// Role definitions with hierarchy levels (1 = highest)
export const ROLES: Record<RoleName, RoleConfig> = {
  superadmin: {
    level: 1,
    label: "Super Admin",
    color: "#ef4444",
    bgColor: "#ef444420",
    description: "Full system access (developer)",
  },
  manager_fms: {
    level: 2,
    label: "Manager FMS",
    color: "#8b5cf6",
    bgColor: "#8b5cf620",
    description: "Manager Facility Management Services",
  },
  admin_pusat: {
    level: 2,
    label: "Admin Pusat",
    color: "#1769FF",
    bgColor: "#1769FF20",
    description: "Administrator Pusat FMS",
  },
  admin_regional: {
    level: 3,
    label: "Admin Regional",
    color: "#06b6d4",
    bgColor: "#06b6d420",
    description: "Admin Regional (multi-lokasi)",
  },
  admin_lokasi: {
    level: 3,
    label: "Admin Lokasi",
    color: "#10b981",
    bgColor: "#10b98120",
    description: "Admin Lokasi (single site)",
  },
  user: {
    level: 4,
    label: "User",
    color: "#6b7280",
    bgColor: "#6b728020",
    description: "User operasional dasar",
  },
};

// All valid role names
export const ROLE_NAMES: RoleName[] = [
  "superadmin",
  "manager_fms",
  "admin_pusat",
  "admin_regional",
  "admin_lokasi",
  "user",
];

// ── Permission Keys ──────────────────────────────────────
export type PermissionKey =
  | "dashboard_view"
  // Aset
  | "asset_create"
  | "asset_view"
  | "asset_update"
  | "asset_delete"
  // Legal Documents
  | "legal_create"
  | "legal_view"
  | "legal_update"
  | "legal_delete"
  // Work Order
  | "wo_create"
  | "wo_approve"
  | "wo_update"
  | "wo_delete"
  // User Management
  | "user_manage"
  // Audit Log
  | "audit_log_view"
  // Master Data
  | "master_data"
  // Analytics
  | "analytics_view"
  // Vendor
  | "vendor_manage"
  | "vendor_view"
  // RAB
  | "rab_manage"
  | "rab_view"
  // Accounting
  | "accounting_manage"
  | "accounting_view"
  // HRD
  | "hrd_manage"
  | "hrd_view"
  // Maintenance
  | "maintenance_manage"
  | "maintenance_view"
  // SMK3
  | "smk3_manage"
  | "smk3_view"
  // Inventory
  | "inventory_manage"
  | "inventory_view"
  // Compliance Report
  | "compliance_report"
  // Notifications
  | "notification_manage"
  | "notification_view"
  // Upload
  | "upload"
  // App Settings
  | "app_settings_manage"
  | "app_settings_view"
  // Chat / AI
  | "chat_use"
  // Reminder
  | "reminder_view";

// ── Permission Matrix ────────────────────────────────────
// Each permission lists the roles that have it
const L1: RoleName[] = ["superadmin"];
const L2: RoleName[] = ["superadmin", "manager_fms", "admin_pusat"];
const L3: RoleName[] = [
  "superadmin",
  "manager_fms",
  "admin_pusat",
  "admin_regional",
];
const L3L: RoleName[] = [
  "superadmin",
  "manager_fms",
  "admin_pusat",
  "admin_regional",
  "admin_lokasi",
];
const ALL: RoleName[] = [
  "superadmin",
  "manager_fms",
  "admin_pusat",
  "admin_regional",
  "admin_lokasi",
  "user",
];

export const PERMISSIONS: Record<PermissionKey, RoleName[]> = {
  // Dashboard
  dashboard_view: ALL,

  // Aset
  asset_create: L3L,
  asset_view: ALL,
  asset_update: L3L,
  asset_delete: L2,

  // Legal Documents
  legal_create: L3L,
  legal_view: ALL,
  legal_update: L3L,
  legal_delete: L2,

  // Work Order
  wo_create: ALL,
  wo_approve: L3,
  wo_update: L3L,
  wo_delete: L2,

  // User Management
  user_manage: L3,

  // Audit Log
  audit_log_view: L3,

  // Master Data
  master_data: ["superadmin", "admin_pusat"],

  // Analytics
  analytics_view: ALL,

  // Vendor
  vendor_manage: L3,
  vendor_view: L3L,

  // RAB
  rab_manage: L3,
  rab_view: L3L,

  // Accounting
  accounting_manage: L3,
  accounting_view: L3,

  // HRD
  hrd_manage: L3,
  hrd_view: L3L,

  // Maintenance
  maintenance_manage: L3L,
  maintenance_view: ALL,

  // SMK3
  smk3_manage: L3L,
  smk3_view: ALL,

  // Inventory
  inventory_manage: L3L,
  inventory_view: ALL,

  // Compliance Report
  compliance_report: L3L,

  // Notifications
  notification_manage: L2,
  notification_view: ALL,

  // Upload
  upload: L3L,

  // App Settings
  app_settings_manage: L2,
  app_settings_view: L2,

  // Chat / AI
  chat_use: ALL,

  // Reminder
  reminder_view: ALL,
};

// ── Helper Functions ─────────────────────────────────────

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: string,
  permission: PermissionKey,
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role as RoleName);
}

/**
 * Get role config (with fallback for unknown roles)
 */
export function getRoleConfig(role: string): RoleConfig {
  return ROLES[role as RoleName] || ROLES.user;
}

/**
 * Get role level (1=highest, 4=lowest)
 */
export function getRoleLevel(role: string): number {
  return ROLES[role as RoleName]?.level ?? 99;
}

/**
 * Check if actor can manage target role
 * Actor must be at a higher (lower number) or equal level
 * Exception: cannot manage same role unless superadmin
 */
export function canManageRole(actorRole: string, targetRole: string): boolean {
  const actorLevel = getRoleLevel(actorRole);
  const targetLevel = getRoleLevel(targetRole);
  if (actorRole === "superadmin") return true;
  return actorLevel < targetLevel;
}

/**
 * Get roles that an actor can assign (roles below their level)
 */
export function getAssignableRoles(actorRole: string): RoleName[] {
  if (actorRole === "superadmin") return ROLE_NAMES;
  const actorLevel = getRoleLevel(actorRole);
  return ROLE_NAMES.filter((r) => ROLES[r].level > actorLevel);
}

/**
 * Check if a role should see data filtered by region
 */
export function isRegionScoped(role: string): boolean {
  return (
    role === "admin_regional" || role === "admin_lokasi" || role === "user"
  );
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: string): PermissionKey[] {
  return (Object.entries(PERMISSIONS) as [PermissionKey, RoleName[]][])
    .filter(([, roles]) => roles.includes(role as RoleName))
    .map(([key]) => key);
}
