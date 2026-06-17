import { NextResponse } from 'next/server';
import { JWTPayload, AuthenticatedRequest } from './auth-middleware';

// Pemetaan akses sesuai BRD §4 Matriks Akses Pengguna
// c = create, r = read, u = update, d = delete
type Permission = 'c' | 'r' | 'u' | 'd';
type RolePermissions = Record<string, Permission[]>;

const ACCESS_MATRIX: Record<string, RolePermissions> = {
  'assets':           { admin: ['c','r','u','d'], operator: ['r','u'],     viewer: ['r'] },
  'legal-documents':  { admin: ['c','r','u','d'], operator: ['c','r','u'], viewer: ['r'] },
  'notifications':    { admin: ['c','r','u','d'], operator: ['r'],         viewer: ['r'] },
  'audit-logs':       { admin: ['r'],             operator: [],            viewer: [] },
  'management':       { admin: ['c','r','u','d'], operator: ['r','u'],     viewer: ['r'] },
  'admin':            { admin: ['c','r','u','d'], operator: ['r'],         viewer: ['r'] },
  'upload':           { admin: ['c'],             operator: ['c'],         viewer: [] },
  'auth':             { admin: ['r'],             operator: ['r'],         viewer: ['r'] }, // public
  'cron':             { admin: ['c'],             operator: [],            viewer: [] },
};

// Map HTTP method to CRUD action
function methodToPermission(method: string): Permission {
  switch (method.toUpperCase()) {
    case 'POST':   return 'c';
    case 'GET':    return 'r';
    case 'PUT':
    case 'PATCH':  return 'u';
    case 'DELETE': return 'd';
    default:       return 'r';
  }
}

// RBAC middleware wrapper
export function withRBAC(
  handler: (req: AuthenticatedRequest, user: JWTPayload) => Promise<NextResponse>,
  resource: string
) {
  return async (req: AuthenticatedRequest, user: JWTPayload) => {
    const requiredPermission = methodToPermission(req.method);
    
    // Resolve resource key (management/* → management)
    const resourceKey = resource.includes('/') ? resource.split('/')[0] : resource;
    
    const rolePermissions = ACCESS_MATRIX[resourceKey];
    if (!rolePermissions) {
      // Resource not in matrix — allow by default (internal routes)
      return handler(req, user);
    }

    const userPermissions = rolePermissions[user.role] || [];
    
    if (!userPermissions.includes(requiredPermission)) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Forbidden: Role "${user.role}" tidak memiliki akses ${requiredPermission.toUpperCase()} pada resource "${resource}".` 
        },
        { status: 403 }
      );
    }

    return handler(req, user);
  };
}
