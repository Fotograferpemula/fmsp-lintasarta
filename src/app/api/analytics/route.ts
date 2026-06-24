import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  withAuth,
  JWTPayload,
  AuthenticatedRequest,
} from "@/lib/auth-middleware";
import { withPermission } from "@/lib/rbac-middleware";
import { getRegionFilter, getRegionFilterNested } from "@/lib/region-filter";
import { handleApiError } from "@/lib/api-error";

async function handleGet(req: AuthenticatedRequest, user: JWTPayload) {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const regionWhere = getRegionFilter(user);
    const regionNestedWhere = getRegionFilterNested(user);

    const [assets, legalDocs, workOrders, maintenanceSchedules, auditLogs] =
      await Promise.all([
        prisma.asset.findMany({
          where: regionWhere,
          select: {
            id: true,
            type: true,
            location: true,
            status: true,
            bookValue: true,
            purchaseDate: true,
            purchaseCost: true,
            expectedLifeYrs: true,
            createdAt: true,
          },
        }),
        prisma.legalDocument.findMany({
          where: regionNestedWhere,
          select: {
            id: true,
            complianceStatus: true,
            expiryDate: true,
            createdAt: true,
            assetId: true,
          },
        }),
        prisma.workOrder.findMany({
          select: {
            id: true,
            status: true,
            priority: true,
            category: true,
            approvalStatus: true,
            createdAt: true,
            resolvedAt: true,
          },
          where: { ...regionNestedWhere, createdAt: { gte: twelveMonthsAgo } },
          orderBy: { createdAt: "asc" },
        }),
        prisma.maintenanceSchedule.findMany({
          select: { id: true, status: true, assetId: true, nextDue: true },
        }),
        prisma.auditLog.findMany({
          select: { timestamp: true, action: true },
          where: { timestamp: { gte: twelveMonthsAgo } },
          orderBy: { timestamp: "asc" },
        }),
      ]);

    // ── 1. COMPLIANCE TREND per bulan (12 bulan) ──────────────
    const complianceTrend = [];
    for (let i = 11; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const label = monthDate.toLocaleString("id-ID", {
        month: "short",
        year: "2-digit",
      });

      // Docs alive at that month
      const activeDocs = legalDocs.filter((d) => {
        const created = new Date(d.createdAt);
        const expiry = d.expiryDate ? new Date(d.expiryDate) : null;
        return created <= monthEnd && (!expiry || expiry >= monthDate);
      });

      const expiredDocs = activeDocs.filter((d) => {
        const expiry = d.expiryDate ? new Date(d.expiryDate) : null;
        return expiry && expiry < monthDate;
      });

      const rate =
        activeDocs.length > 0
          ? Math.round(
              ((activeDocs.length - expiredDocs.length) / activeDocs.length) *
                100,
            )
          : 100;

      complianceTrend.push({
        bulan: label,
        rate,
        total: activeDocs.length,
        expired: expiredDocs.length,
      });
    }

    // ── 2. WORK ORDER per bulan (status breakdown) ─────────────
    const woTrend: Record<
      string,
      {
        bulan: string;
        open: number;
        in_progress: number;
        resolved: number;
        closed: number;
      }
    > = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString("id-ID", {
        month: "short",
        year: "2-digit",
      });
      woTrend[key] = {
        bulan: key,
        open: 0,
        in_progress: 0,
        resolved: 0,
        closed: 0,
      };
    }
    workOrders.forEach((wo) => {
      const key = new Date(wo.createdAt).toLocaleString("id-ID", {
        month: "short",
        year: "2-digit",
      });
      if (woTrend[key]) {
        const s = wo.status as keyof (typeof woTrend)[string];
        if (s in woTrend[key]) (woTrend[key] as any)[s]++;
      }
    });
    const woTrendArr = Object.values(woTrend);

    // ── 3. WO per KATEGORI ─────────────────────────────────────
    const woByCat: Record<string, number> = {};
    workOrders.forEach((wo) => {
      woByCat[wo.category] = (woByCat[wo.category] || 0) + 1;
    });
    const woByCategory = Object.entries(woByCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ── 4. ASET per TIPE (nilai & jumlah) ─────────────────────
    const assetByType: Record<string, { count: number; value: number }> = {};
    assets.forEach((a) => {
      const type =
        a.type === "land"
          ? "Tanah"
          : a.type === "office"
            ? "Gedung"
            : a.type === "facility"
              ? "Fasilitas"
              : a.type === "vehicle"
                ? "Kendaraan"
                : a.type;
      if (!assetByType[type]) assetByType[type] = { count: 0, value: 0 };
      assetByType[type].count++;
      assetByType[type].value += a.bookValue;
    });
    const assetTypeData = Object.entries(assetByType)
      .map(([name, d]) => ({
        name,
        count: d.count,
        value: d.value,
      }))
      .sort((a, b) => b.value - a.value);

    // ── 5. ASET per LOKASI ─────────────────────────────────────
    const assetByLocation: Record<
      string,
      {
        count: number;
        value: number;
        good: number;
        warning: number;
        broken: number;
      }
    > = {};
    assets.forEach((a) => {
      if (!assetByLocation[a.location])
        assetByLocation[a.location] = {
          count: 0,
          value: 0,
          good: 0,
          warning: 0,
          broken: 0,
        };
      assetByLocation[a.location].count++;
      assetByLocation[a.location].value += a.bookValue;
      if (a.status === "good") assetByLocation[a.location].good++;
      else if (a.status === "warning") assetByLocation[a.location].warning++;
      else if (a.status === "broken") assetByLocation[a.location].broken++;
    });
    const locationData = Object.entries(assetByLocation)
      .map(([name, d]) => ({
        name: name.length > 20 ? name.substring(0, 18) + "…" : name,
        fullName: name,
        ...d,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // ── 6. MAINTENANCE STATUS pie ──────────────────────────────
    const maintStatus: Record<string, number> = {};
    maintenanceSchedules.forEach((m) => {
      maintStatus[m.status] = (maintStatus[m.status] || 0) + 1;
    });
    const maintStatusData = Object.entries(maintStatus).map(
      ([name, value]) => ({ name, value }),
    );

    // ── 7. DEPRESIASI ASET (estimasi) ─────────────────────────
    const depreciationData = assets
      .filter(
        (a) =>
          a.purchaseDate &&
          a.purchaseCost &&
          a.expectedLifeYrs &&
          a.expectedLifeYrs > 0,
      )
      .map((a) => {
        const yearsOld =
          (now.getTime() - new Date(a.purchaseDate!).getTime()) /
          (365.25 * 86400000);
        const depreciatedPct = Math.min(
          100,
          Math.round((yearsOld / a.expectedLifeYrs!) * 100),
        );
        const currentValue = Math.max(
          0,
          a.purchaseCost! * (1 - depreciatedPct / 100),
        );
        return {
          name:
            a.type === "land"
              ? "Tanah"
              : a.type === "office"
                ? "Gedung"
                : a.type === "facility"
                  ? "Fasilitas"
                  : "Kendaraan",
          purchaseCost: a.purchaseCost,
          currentValue: Math.round(currentValue),
          depreciatedPct,
        };
      })
      .sort((a, b) => b.purchaseCost! - a.purchaseCost!);

    // ── 8. AKTIVITAS AUDIT per minggu ─────────────────────────
    const weeklyActivity: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 7 * 86400000);
      const label = `Mgg ${12 - i}`;
      weeklyActivity[label] = 0;
    }
    auditLogs.forEach((log) => {
      const weekNum = Math.floor(
        (now.getTime() - new Date(log.timestamp).getTime()) / (7 * 86400000),
      );
      if (weekNum >= 0 && weekNum < 12) {
        const label = `Mgg ${12 - weekNum}`;
        if (weeklyActivity[label] !== undefined) weeklyActivity[label]++;
      }
    });
    const activityData = Object.entries(weeklyActivity).map(
      ([name, count]) => ({ name, count }),
    );

    return NextResponse.json({
      success: true,
      data: {
        complianceTrend,
        woTrend: woTrendArr,
        woByCategory,
        assetTypeData,
        locationData,
        maintStatusData,
        depreciationData,
        activityData,
        summary: {
          totalAssets: assets.length,
          totalDocs: legalDocs.length,
          totalWO: workOrders.length,
          totalMaint: maintenanceSchedules.length,
          overallCompliance:
            legalDocs.length > 0
              ? Math.round(
                  (legalDocs.filter((d) => d.complianceStatus === "valid")
                    .length /
                    legalDocs.length) *
                    100,
                )
              : 100,
        },
      },
    });
  } catch (error: any) {
    return handleApiError(error, "API");
  }
}

export const GET = withAuth(withPermission("analytics_view", handleGet));
