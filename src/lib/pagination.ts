/**
 * Reusable pagination helper for API endpoints.
 * Usage:
 *   const { page, limit, skip } = parsePagination(searchParams);
 *   const [data, total] = await Promise.all([
 *     prisma.model.findMany({ ...where, skip, take: limit }),
 *     prisma.model.count({ where }),
 *   ]);
 *   return { data, pagination: paginationMeta(total, page, limit) };
 */

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") || "50")),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
