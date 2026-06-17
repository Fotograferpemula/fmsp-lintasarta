import QRCode from 'qrcode';

const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3847';

export async function generateAssetQRCode(assetId: string, assetName: string): Promise<string> {
  const url = `${APP_BASE_URL}/?tab=assets&id=${assetId}`;
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 300,
    margin: 2,
    color: { dark: '#1e40af', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  return qrDataUrl;
}

export async function generateAssetQRSvg(assetId: string): Promise<string> {
  const url = `${APP_BASE_URL}/?tab=assets&id=${assetId}`;
  const svg = await QRCode.toString(url, {
    type: 'svg',
    width: 300,
    margin: 2,
    color: { dark: '#1e40af', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  return svg;
}
