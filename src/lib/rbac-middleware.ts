import { NextResponse } from "next/server";
import { JWTPayload, AuthenticatedRequest } from "./auth-middleware";
import { hasPermission, PermissionKey } from "./rbac";

/**
 * RBAC middleware wrapper — permission-based.
 * Replaces the old HTTP-method-based withRBAC to align with BRD §2.2.
 *
 * @param permission - PermissionKey from src/lib/rbac.ts
 * @param handler - Route handler
 */
export function withPermission(
  permission: PermissionKey,
  handler: (
    req: AuthenticatedRequest,
    user: JWTPayload,
  ) => Promise<NextResponse>,
) {
  return async (req: AuthenticatedRequest, user: JWTPayload) => {
    // SuperAdmin bypass
    if (user.role === "superadmin") {
      return handler(req, user);
    }

    if (!hasPermission(user.role, permission)) {
      return NextResponse.json(
        {
          success: false,
          error: `Forbidden: Role "${user.role}" tidak memiliki permission "${permission}".`,
        },
        { status: 403 },
      );
    }

    return handler(req, user);
  };
}

/**
 * @deprecated Use withPermission(permissionKey, handler) instead.
 * Kept for temporary backward compatibility during migration.
 */
export function withRBAC(
  handler: (
    req: AuthenticatedRequest,
    user: JWTPayload,
  ) => Promise<NextResponse>,
  resource: string,
) {
  // Map legacy resources to a sensible default permission.
  // This fallback will be removed once all routes are migrated.
  const fallbackMap: Record<string, PermissionKey> = {
    assets: "asset_view",
    "legal-documents": "legal_view",
    notifications: "notification_view",
    "audit-logs": "audit_log_view",
    management: "maintenance_view",
    admin: "master_data",
    upload: "upload",
    auth: "dashboard_view",
    cron: "notification_manage",
    reports: "compliance_report",
    analytics: "analytics_view",
    "app-settings": "app_settings_view",
    chat: "chat_use",
  };

  const permission = fallbackMap[resource] || "dashboard_view";
  return withPermission(permission, handler);
}
