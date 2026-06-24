import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { EmployeeCreateSchema, validateRequest } from "@/lib/validators";
import { handleApiError } from "@/lib/api-error";

const RESOURCE = "management";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const roleFilter = searchParams.get("role");
    const deptFilter = searchParams.get("department");

    const where: Record<string, string> = {};
    if (roleFilter) where.role = roleFilter;
    if (deptFilter) where.department = deptFilter;

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { nip: "asc" },
    });
    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(EmployeeCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 },
      );
    }
    const {
      nip,
      name,
      role,
      department,
      phone,
      email,
      joinDate,
      contractType,
      status,
      baseSalary,
      skills,
      gadaLevel,
      ktaNumber,
      ktaExpiry,
    } = validation.data;

    const existing = await prisma.employee.findUnique({ where: { nip } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Employee dengan NIP ${nip} sudah ada.` },
        { status: 400 },
      );
    }

    const employee = await prisma.employee.create({
      data: {
        nip,
        name,
        role,
        department,
        phone,
        email,
        joinDate: new Date(joinDate),
        contractType,
        status: status || "active",
        baseSalary,
        skills: Array.isArray(skills) ? skills : [],
        gadaLevel: gadaLevel || null,
        ktaNumber: ktaNumber || null,
        ktaExpiry: ktaExpiry ? new Date(ktaExpiry) : null,
      },
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "CREATE_EMPLOYEE",
        resource: "Employee",
        details: `Employee "${name}" (NIP: ${nip}) ditambahkan.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id)
      return NextResponse.json(
        { success: false, error: "ID wajib diisi." },
        { status: 400 },
      );

    // Whitelist: hanya field ini yang boleh diubah (NIP blocked)
    const ALLOWED = [
      "name",
      "role",
      "department",
      "phone",
      "email",
      "joinDate",
      "contractType",
      "status",
      "baseSalary",
      "skills",
      "gadaLevel",
      "ktaNumber",
      "ktaExpiry",
    ] as const;
    const updates: Record<string, any> = {};
    for (const key of ALLOWED) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    if (updates.joinDate) updates.joinDate = new Date(updates.joinDate);
    if (updates.baseSalary !== undefined)
      updates.baseSalary = parseFloat(updates.baseSalary);
    if (updates.ktaExpiry) updates.ktaExpiry = new Date(updates.ktaExpiry);

    const employee = await prisma.employee.update({
      where: { id },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "UPDATE_EMPLOYEE",
        resource: "Employee",
        details: `Employee "${employee.name}" (NIP: ${employee.nip}) diperbarui.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    if (!body.id)
      return NextResponse.json(
        { success: false, error: "ID wajib diisi." },
        { status: 400 },
      );

    const employee = await prisma.employee.findUnique({
      where: { id: body.id },
    });
    await prisma.employee.delete({ where: { id: body.id } });

    await prisma.auditLog.create({
      data: {
        user: user.email,
        action: "DELETE_EMPLOYEE",
        resource: "Employee",
        details: `Employee "${employee?.name}" (NIP: ${employee?.nip}) dihapus.`,
        ip: req.clientIp || "0.0.0.0",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Employee berhasil dihapus.",
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("hrd_view", handleGet));
export const POST = withAuth(withPermission("hrd_manage", handlePost));
export const PUT = withAuth(withPermission("hrd_manage", handlePut));
export const DELETE = withAuth(withPermission("hrd_manage", handleDelete));
