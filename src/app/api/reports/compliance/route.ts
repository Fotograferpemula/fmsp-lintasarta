import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { handleApiError } from "@/lib/api-error";

// GET /api/reports/compliance
// Generate JSON data for compliance report (PDF rendered client-side)
async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const now = new Date();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "json"; // json | html

    // Fetch all data needed for compliance report
    const [assets, legalDocs, maintenanceSchedules, workOrders] =
      await Promise.all([
        prisma.asset.findMany({
          orderBy: { name: "asc" },
          include: { legalDocuments: true },
        }),
        prisma.legalDocument.findMany({
          orderBy: [{ complianceStatus: "asc" }, { expiryDate: "asc" }],
          include: { asset: { select: { name: true, location: true } } },
        }),
        prisma.maintenanceSchedule.findMany({
          orderBy: { nextDue: "asc" },
          include: { asset: { select: { name: true } } },
        }),
        prisma.workOrder.findMany({
          where: { status: { in: ["open", "in_progress"] } },
          orderBy: { createdAt: "desc" },
          include: { asset: { select: { name: true } } },
        }),
      ]);

    // Calculate KPIs
    const totalDocs = legalDocs.length;
    const validDocs = legalDocs.filter(
      (d) => d.complianceStatus === "valid",
    ).length;
    const warningDocs = legalDocs.filter(
      (d) => d.complianceStatus === "warning",
    ).length;
    const expiredDocs = legalDocs.filter(
      (d) => d.complianceStatus === "expired",
    ).length;
    const complianceRate =
      totalDocs > 0 ? Math.round((validDocs / totalDocs) * 100) : 100;

    const overdueSchedules = maintenanceSchedules.filter(
      (s) => s.status === "overdue",
    ).length;
    const totalValue = assets.reduce((sum, a) => sum + a.bookValue, 0);
    const goodAssets = assets.filter((a) => a.status === "good").length;

    // Expiring within 30 days
    const in30days = new Date(now.getTime() + 30 * 86400000);
    const expiringSoon = legalDocs.filter(
      (d) =>
        d.expiryDate &&
        new Date(d.expiryDate) <= in30days &&
        d.complianceStatus !== "expired",
    );

    const reportData = {
      generatedAt: now.toISOString(),
      generatedBy: user.name || user.email,
      period: {
        month: now.toLocaleString("id-ID", { month: "long" }),
        year: now.getFullYear(),
      },
      kpi: {
        complianceRate,
        totalAssets: assets.length,
        goodAssets,
        totalPortfolioValue: totalValue,
        totalDocuments: totalDocs,
        validDocuments: validDocs,
        warningDocuments: warningDocs,
        expiredDocuments: expiredDocs,
        overdueMaintenanceCount: overdueSchedules,
        openWorkOrders: workOrders.length,
      },
      expiringSoon: expiringSoon.map((d) => ({
        title: d.title,
        assetName: d.asset?.name,
        expiryDate: d.expiryDate,
        status: d.complianceStatus,
        daysLeft: d.expiryDate
          ? Math.ceil(
              (new Date(d.expiryDate).getTime() - now.getTime()) / 86400000,
            )
          : 0,
      })),
      assetsSummary: assets.map((a) => ({
        name: a.name,
        type: a.type,
        location: a.location,
        status: a.status,
        bookValue: a.bookValue,
        documentsCount: a.legalDocuments.length,
        expiredDocsCount: a.legalDocuments.filter(
          (d) => d.complianceStatus === "expired",
        ).length,
      })),
      maintenanceSummary: maintenanceSchedules.map((s) => ({
        title: s.title,
        assetName: s.asset?.name,
        status: s.status,
        nextDue: s.nextDue,
        assignedTo: s.assignedTo,
      })),
      openWorkOrders: workOrders.map((wo) => ({
        ticketNumber: wo.ticketNumber,
        title: wo.title,
        priority: wo.priority,
        status: wo.status,
        assetName: wo.asset?.name,
        slaDeadline: wo.slaDeadline,
      })),
    };

    if (format === "html") {
      // Return pre-rendered HTML for PDF generation
      const html = generateComplianceHtml(reportData);
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Content-Disposition": `attachment; filename="compliance-report-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}.html"`,
        },
      });
    }

    return NextResponse.json({ success: true, data: reportData });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

function generateComplianceHtml(data: any): string {
  const fmt = (num: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  const fmtDate = (d: any) =>
    d
      ? new Date(d).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : "-";

  const statusColor: Record<string, string> = {
    valid: "#10b981",
    warning: "#f59e0b",
    expired: "#ef4444",
    good: "#10b981",
    overdue: "#ef4444",
    in_progress: "#3b82f6",
    open: "#f59e0b",
    critical: "#ef4444",
    medium: "#f59e0b",
    high: "#ef4444",
    low: "#6b7280",
  };

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Compliance FMSP Lintasarta — ${data.period.month} ${data.period.year}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1f2937; background: #f9fafb; }
    .page { max-width: 900px; margin: 0 auto; background: white; padding: 32px; }
    .header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 20px; border-bottom: 3px solid #1769FF; margin-bottom: 24px; }
    .header-left h1 { font-size: 20px; font-weight: 700; color: #1769FF; }
    .header-left p { color: #6b7280; font-size: 11px; margin-top: 4px; }
    .header-right { text-align: right; color: #6b7280; font-size: 10px; }
    .section-title { font-size: 13px; font-weight: 700; color: #111827; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
    .kpi-card { background: #f0f5ff; border: 1px solid #c7d9ff; border-radius: 8px; padding: 12px; text-align: center; }
    .kpi-card.red { background: #fff1f0; border-color: #fca5a5; }
    .kpi-card.green { background: #f0fdf4; border-color: #86efac; }
    .kpi-card.yellow { background: #fffbeb; border-color: #fde68a; }
    .kpi-value { font-size: 22px; font-weight: 800; color: #1769FF; }
    .kpi-card.red .kpi-value { color: #ef4444; }
    .kpi-card.green .kpi-value { color: #10b981; }
    .kpi-card.yellow .kpi-value { color: #f59e0b; }
    .kpi-label { font-size: 10px; color: #6b7280; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 10px; }
    th { background: #f0f5ff; color: #1769FF; font-weight: 600; padding: 8px 10px; text-align: left; border-bottom: 2px solid #c7d9ff; }
    td { padding: 7px 10px; border-bottom: 1px solid #f3f4f6; }
    tr:hover td { background: #f9fafb; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 9px; font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; color: #9ca3af; font-size: 9px; }
    @media print { body { background: white; } .page { padding: 0; } }
    @page { margin: 20mm; }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>🏢 Laporan Compliance Fasilitas</h1>
      <p>Periode: ${data.period.month} ${data.period.year} · Dibuat: ${fmtDate(data.generatedAt)}</p>
    </div>
    <div class="header-right">
      <strong>PT Aplikanusa Lintasarta</strong><br/>
      Facility Management Service Platform<br/>
      Dibuat oleh: ${data.generatedBy}
    </div>
  </div>

  <div class="section-title">📊 Ringkasan KPI Portofolio</div>
  <div class="kpi-grid">
    <div class="kpi-card ${data.kpi.complianceRate >= 80 ? "green" : data.kpi.complianceRate >= 60 ? "yellow" : "red"}">
      <div class="kpi-value">${data.kpi.complianceRate}%</div>
      <div class="kpi-label">Compliance Rate</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${data.kpi.totalAssets}</div>
      <div class="kpi-label">Total Aset</div>
    </div>
    <div class="kpi-card ${data.kpi.expiredDocuments > 0 ? "red" : "green"}">
      <div class="kpi-value">${data.kpi.expiredDocuments}</div>
      <div class="kpi-label">Dokumen Expired</div>
    </div>
    <div class="kpi-card ${data.kpi.openWorkOrders > 3 ? "yellow" : "green"}">
      <div class="kpi-value">${data.kpi.openWorkOrders}</div>
      <div class="kpi-label">WO Open</div>
    </div>
  </div>
  <div class="kpi-grid" style="grid-template-columns: repeat(4,1fr)">
    <div class="kpi-card">
      <div class="kpi-value" style="font-size:14px">${fmt(data.kpi.totalPortfolioValue)}</div>
      <div class="kpi-label">Nilai Portofolio</div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-value">${data.kpi.validDocuments}</div>
      <div class="kpi-label">Dokumen Valid</div>
    </div>
    <div class="kpi-card yellow">
      <div class="kpi-value">${data.kpi.warningDocuments}</div>
      <div class="kpi-label">Dokumen Warning</div>
    </div>
    <div class="kpi-card ${data.kpi.overdueMaintenanceCount > 0 ? "red" : "green"}">
      <div class="kpi-value">${data.kpi.overdueMaintenanceCount}</div>
      <div class="kpi-label">PM Overdue</div>
    </div>
  </div>

  ${
    data.expiringSoon.length > 0
      ? `
  <div class="section-title">⚠️ Dokumen Akan/Sudah Expired (30 hari ke depan)</div>
  <table>
    <thead><tr><th>Dokumen</th><th>Aset</th><th>Jatuh Tempo</th><th>Sisa Hari</th><th>Status</th></tr></thead>
    <tbody>
      ${data.expiringSoon
        .map(
          (d: any) => `
      <tr>
        <td>${d.title}</td>
        <td>${d.assetName || "-"}</td>
        <td>${fmtDate(d.expiryDate)}</td>
        <td style="color:${d.daysLeft <= 0 ? "#ef4444" : d.daysLeft <= 7 ? "#f59e0b" : "#374151"};font-weight:600">
          ${d.daysLeft <= 0 ? `${Math.abs(d.daysLeft)} hari lalu` : `${d.daysLeft} hari`}
        </td>
        <td><span class="badge" style="background:${statusColor[d.status]}20;color:${statusColor[d.status]}">${d.status.toUpperCase()}</span></td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>`
      : ""
  }

  <div class="section-title">🏢 Ringkasan Aset</div>
  <table>
    <thead><tr><th>Nama Aset</th><th>Tipe</th><th>Lokasi</th><th>Status</th><th>Nilai Buku</th><th>Dok.</th></tr></thead>
    <tbody>
      ${data.assetsSummary
        .map(
          (a: any) => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.type}</td>
        <td>${a.location}</td>
        <td><span class="badge" style="background:${statusColor[a.status] || "#6b7280"}20;color:${statusColor[a.status] || "#6b7280"}">${a.status}</span></td>
        <td>${fmt(a.bookValue)}</td>
        <td>${a.documentsCount}${a.expiredDocsCount > 0 ? ` <span style="color:#ef4444">(${a.expiredDocsCount} expired)</span>` : ""}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>

  ${
    data.openWorkOrders.length > 0
      ? `
  <div class="section-title">🔧 Work Order Open</div>
  <table>
    <thead><tr><th>No. Tiket</th><th>Judul</th><th>Aset</th><th>Prioritas</th><th>SLA Deadline</th></tr></thead>
    <tbody>
      ${data.openWorkOrders
        .map(
          (wo: any) => `
      <tr>
        <td><strong>${wo.ticketNumber}</strong></td>
        <td>${wo.title}</td>
        <td>${wo.assetName || "-"}</td>
        <td><span class="badge" style="background:${statusColor[wo.priority] || "#6b7280"}20;color:${statusColor[wo.priority] || "#6b7280"}">${wo.priority}</span></td>
        <td>${fmtDate(wo.slaDeadline)}</td>
      </tr>`,
        )
        .join("")}
    </tbody>
  </table>`
      : ""
  }

  <div class="footer">
    <span>FMSP Lintasarta — Facility Management Service Platform</span>
    <span>© ${data.period.year} PT Aplikanusa Lintasarta · Confidential</span>
  </div>
</div>
<script>window.onload = () => window.print();</script>
</body></html>`;
}

export const GET = withAuth(withPermission("compliance_report", handleGet));
