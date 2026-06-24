import { JWTPayload } from '@/lib/auth-middleware';
import { isRegionScoped } from '@/lib/rbac';

/**
 * Returns a Prisma `where` clause to filter data by user's region.
 * - SuperAdmin, Manager FMS, Admin Pusat → no filter (sees all data)
 * - Admin Regional, Admin Lokasi, User → filter by region
 * 
 * Region values are standardized: 'Medan', 'Bandung', 'Surabaya', 'Jakarta'.
 * The filter uses case-insensitive `contains` to match location strings
 * that include the region name (e.g., 'Gudang MEP, Kantor Medan' matches 'Medan').
 * 
 * @param user - JWT payload with role and region
 * @param locationField - The Prisma field name to filter on (default: 'location')
 * @returns Prisma where clause object
 */
export function getRegionFilter(user: JWTPayload, locationField: string = 'location'): Record<string, any> {
  if (!isRegionScoped(user.role) || !user.region) return {};
  return {
    [locationField]: {
      contains: user.region.trim(),
      mode: 'insensitive',
    },
  };
}

/**
 * Returns a Prisma `where` clause for nested asset location filtering.
 * Used when the data model has a relation to Asset (e.g., LegalDocument → Asset)
 */
export function getRegionFilterNested(user: JWTPayload): Record<string, any> {
  if (!isRegionScoped(user.role) || !user.region) return {};
  return {
    asset: {
      location: {
        contains: user.region.trim(),
        mode: 'insensitive',
      },
    },
  };
}
