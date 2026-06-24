import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, JWTPayload, AuthenticatedRequest } from '@/lib/auth-middleware';
import { generateAssetQRCode, generateAssetQRSvg } from '@/lib/qr-service';
import { handleApiError } from '@/lib/api-error';

// GET /api/assets/qr?id=<assetId>&format=png|svg
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('id');
    const format = searchParams.get('format') || 'png'; // png | svg

    if (!assetId) {
      return NextResponse.json({ success: false, error: 'id parameter wajib diisi' }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({
      where: { id: assetId },
      select: { id: true, name: true, location: true, type: true },
    });

    if (!asset) {
      return NextResponse.json({ success: false, error: 'Aset tidak ditemukan' }, { status: 404 });
    }

    if (format === 'svg') {
      const svg = await generateAssetQRSvg(asset.id);
      return NextResponse.json({
        success: true,
        assetId: asset.id,
        assetName: asset.name,
        format: 'svg',
        data: svg,
      });
    }

    // Default: PNG as base64 data URL
    const dataUrl = await generateAssetQRCode(asset.id, asset.name);
    return NextResponse.json({
      success: true,
      assetId: asset.id,
      assetName: asset.name,
      location: asset.location,
      type: asset.type,
      format: 'png',
      dataUrl,
      printLabel: {
        title: asset.name,
        subtitle: asset.location,
        code: `FMSP-${asset.id.slice(-8).toUpperCase()}`,
      },
    });
  } catch (error: any) {
    return handleApiError(error, 'API');
  }
}

export const GET = withAuth(handleGet);
