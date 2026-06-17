import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { withRBAC } from '@/lib/rbac-middleware';
import { LegalDocCreateSchema, LegalDocUpdateSchema, DeleteByIdSchema, validateRequest } from '@/lib/validators';

const RESOURCE = 'legal-documents';

function calculateComplianceStatus(expiryDateStr: string): string {
  const expiry = new Date(expiryDateStr);
  const now = new Date();
  expiry.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'warning';
  return 'valid';
}

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const docs = await prisma.legalDocument.findMany({
      include: { asset: { select: { name: true, location: true } } },
      orderBy: { expiryDate: 'asc' },
    });
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePost(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(LegalDocCreateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { assetId, title, documentType, documentUrl, issueDate, expiryDate, regNumber, issuingAuthority } = validation.data;
    const complianceStatus = calculateComplianceStatus(expiryDate);

    const doc = await prisma.legalDocument.create({
      data: {
        assetId, title, documentType,
        documentUrl: documentUrl || '/uploads/docs/default.pdf',
        issueDate: new Date(issueDate),
        expiryDate: new Date(expiryDate),
        complianceStatus,
        regNumber: regNumber || null,
        issuingAuthority: issuingAuthority || null,
      },
    });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'CREATE_LEGAL_DOC', resource: 'LegalDocument', details: `Dokumen "${title}" ditambahkan oleh ${user.name}.` },
    });

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handlePut(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(LegalDocUpdateSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { id, title, documentType, documentUrl, issueDate, expiryDate, regNumber, issuingAuthority } = validation.data;
    const currentDoc = await prisma.legalDocument.findUnique({ where: { id } });
    if (!currentDoc) {
      return NextResponse.json({ success: false, error: 'Legal document not found' }, { status: 404 });
    }

    const finalExpiryDate = expiryDate || currentDoc.expiryDate.toISOString();
    const complianceStatus = calculateComplianceStatus(finalExpiryDate);

    const updatedDoc = await prisma.legalDocument.update({
      where: { id },
      data: {
        title: title || currentDoc.title,
        documentType: documentType || currentDoc.documentType,
        documentUrl: documentUrl || currentDoc.documentUrl,
        issueDate: issueDate ? new Date(issueDate) : currentDoc.issueDate,
        expiryDate: expiryDate ? new Date(expiryDate) : currentDoc.expiryDate,
        complianceStatus,
        regNumber: regNumber !== undefined ? regNumber : undefined,
        issuingAuthority: issuingAuthority !== undefined ? issuingAuthority : undefined,
      },
    });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'UPDATE_LEGAL_DOC', resource: 'LegalDocument', details: `Dokumen "${updatedDoc.title}" diperbarui oleh ${user.name}.` },
    });

    return NextResponse.json({ success: true, data: updatedDoc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

async function handleDelete(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const body = await req.json();
    const validation = validateRequest(DeleteByIdSchema, body);
    if (!validation.success) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    const { id } = validation.data;
    const doc = await prisma.legalDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ success: false, error: 'Legal document not found' }, { status: 404 });
    }

    await prisma.legalDocument.delete({ where: { id } });

    await prisma.auditLog.create({
      data: { user: user.email, action: 'DELETE_LEGAL_DOC', resource: 'LegalDocument', details: `Dokumen "${doc.title}" telah dihapus oleh ${user.name}.` },
    });

    return NextResponse.json({ success: true, message: `Dokumen "${doc.title}" berhasil dihapus.` });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = withAuth(withRBAC(handleGet, RESOURCE));
export const POST = withAuth(withRBAC(handlePost, RESOURCE));
export const PUT = withAuth(withRBAC(handlePut, RESOURCE));
export const DELETE = withAuth(withRBAC(handleDelete, RESOURCE));
