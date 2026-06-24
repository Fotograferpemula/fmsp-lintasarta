import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.legalDocument.deleteMany({});
  await prisma.assetTransfer.deleteMany({});
  await prisma.workOrder.deleteMany({});
  await prisma.maintenanceSchedule.deleteMany({});
  await prisma.accountingTransaction.deleteMany({});
  await prisma.rabBudget.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.smk3Item.deleteMany({});
  await prisma.vendorContract.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.passwordResetRequest.deleteMany({});
  await prisma.pushSubscription.deleteMany({});
  await prisma.user.deleteMany({});

  const bcryptHash = '$2b$10$t2QUjXtOojZFB15LQ9Iap.cESbxnmuv0Pj1JgEr7zYAc9Me20vnW6'; // Admin@2026
  const now = new Date();

  // ────────────────────────────────────────────────────────
  // 2. USERS — 4 Regional Structure
  // ────────────────────────────────────────────────────────

  // ── Kantor Pusat Jakarta (Nasional — tanpa filter region) ──
  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@lintasarta.co.id',
      name: 'System SuperAdmin',
      role: 'superadmin',
      department: 'IT',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@lintasarta.co.id',
      name: 'Budi Santoso',
      role: 'manager_fms',
      department: 'FM',
      passwordHash: bcryptHash,
    },
  });

  const adminPusat = await prisma.user.create({
    data: {
      email: 'admin@lintasarta.co.id',
      name: 'Lintasarta Admin Pusat',
      role: 'admin_pusat',
      department: 'FM',
      passwordHash: bcryptHash,
    },
  });

  // ── Regional Medan ──
  const adminRegionalMedan = await prisma.user.create({
    data: {
      email: 'regional.medan@lintasarta.co.id',
      name: 'Ahmad Siregar',
      role: 'admin_regional',
      department: 'FM',
      region: 'Medan',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  const adminLokasiMedan = await prisma.user.create({
    data: {
      email: 'lokasi.medan@lintasarta.co.id',
      name: 'Fitri Nasution',
      role: 'admin_lokasi',
      department: 'FM',
      region: 'Medan',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  const userMedan = await prisma.user.create({
    data: {
      email: 'teknisi.medan@lintasarta.co.id',
      name: 'Operator Medan',
      role: 'user',
      department: 'Engineering',
      region: 'Medan',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  // ── Regional Bandung (termasuk Jatiluhur) ──
  const adminRegionalBandung = await prisma.user.create({
    data: {
      email: 'regional.bandung@lintasarta.co.id',
      name: 'Andi Prasetyo',
      role: 'admin_regional',
      department: 'FM',
      region: 'Bandung',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  const adminLokasiBandung = await prisma.user.create({
    data: {
      email: 'lokasi.bandung@lintasarta.co.id',
      name: 'Dewi Lestari',
      role: 'admin_lokasi',
      department: 'FM',
      region: 'Bandung',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  const userBandung = await prisma.user.create({
    data: {
      email: 'teknisi.bandung@lintasarta.co.id',
      name: 'Operator Bandung',
      role: 'user',
      department: 'Engineering',
      region: 'Bandung',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  // ── Regional Surabaya ──
  const adminRegionalSurabaya = await prisma.user.create({
    data: {
      email: 'regional.surabaya@lintasarta.co.id',
      name: 'Eko Wahyudi',
      role: 'admin_regional',
      department: 'FM',
      region: 'Surabaya',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  const adminLokasiSurabaya = await prisma.user.create({
    data: {
      email: 'lokasi.surabaya@lintasarta.co.id',
      name: 'Sari Wulandari',
      role: 'admin_lokasi',
      department: 'FM',
      region: 'Surabaya',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  const userSurabaya = await prisma.user.create({
    data: {
      email: 'teknisi.surabaya@lintasarta.co.id',
      name: 'Operator Surabaya',
      role: 'user',
      department: 'Engineering',
      region: 'Surabaya',
      passwordHash: bcryptHash,
      mustChangePassword: true,
    },
  });

  console.log('Created 12 Users across 4 regions:', {
    pusat: [superadmin.email, manager.email, adminPusat.email],
    medan: [adminRegionalMedan.email, adminLokasiMedan.email, userMedan.email],
    bandung: [adminRegionalBandung.email, adminLokasiBandung.email, userBandung.email],
    surabaya: [adminRegionalSurabaya.email, adminLokasiSurabaya.email, userSurabaya.email],
  });

  // ────────────────────────────────────────────────────────
  // 3. ASSETS — Multi-Regional
  // ────────────────────────────────────────────────────────

  // ── Jakarta Pusat ──
  const assetJktHQ = await prisma.asset.create({
    data: {
      name: 'Menara Thamrin Lt. 9 — Kantor Pusat Lintasarta',
      type: 'office',
      location: 'Menara Thamrin Lt. 9, Jakarta Pusat',
      specs: { floors: 2, landAreaSqm: 800, buildingAreaSqm: 1600, powerCapacityKVA: 500 },
      status: 'good',
      bookValue: 45000000000,
      purchaseDate: new Date('2010-01-15'),
      purchaseCost: 55000000000,
      expectedLifeYrs: 30,
      lifecycleStatus: 'operational',
    },
  });

  // ── Bandung (termasuk Jatiluhur) ──
  const assetJatiluhur = await prisma.asset.create({
    data: {
      name: 'Gedung Technopark Lintasarta Jatiluhur',
      type: 'office',
      location: 'Jatiluhur, Purwakarta — Regional Bandung',
      specs: { floors: 3, landAreaSqm: 12000, buildingAreaSqm: 8500, powerCapacityKVA: 5000 },
      status: 'good',
      bookValue: 125000000000,
      purchaseDate: new Date('2015-03-20'),
      purchaseCost: 140000000000,
      expectedLifeYrs: 30,
      lifecycleStatus: 'operational',
    },
  });

  const assetACBandung = await prisma.asset.create({
    data: {
      name: 'Precision AC AHU-DC01 (Lantai 1)',
      type: 'facility',
      location: 'Data Center Room A, Jatiluhur — Regional Bandung',
      specs: { brand: 'Liebert DSE', capacityKW: 120, redundancy: 'N+1', refrigerant: 'R410A', serialNumber: 'LBT-2025-00918' },
      status: 'good',
      bookValue: 750000000,
      purchaseDate: new Date('2023-05-20'),
      purchaseCost: 750000000,
      expectedLifeYrs: 10,
      lifecycleStatus: 'operational',
    },
  });

  const assetGensetBandung = await prisma.asset.create({
    data: {
      name: 'Genset Caterpillar 1500 kVA (Backup A)',
      type: 'facility',
      location: 'Power Station Room, Jatiluhur — Regional Bandung',
      specs: { brand: 'Caterpillar', engineModel: '3512B', fuelType: 'Diesel', fuelCapacityLiters: 5000 },
      status: 'warning',
      bookValue: 2400000000,
      purchaseDate: new Date('2018-09-01'),
      purchaseCost: 2400000000,
      expectedLifeYrs: 15,
      lifecycleStatus: 'operational',
    },
  });

  const assetKantorBandung = await prisma.asset.create({
    data: {
      name: 'Kantor Regional FMS Bandung',
      type: 'office',
      location: 'Jl. Braga No. 45, Bandung',
      specs: { floors: 2, landAreaSqm: 600, buildingAreaSqm: 1200, powerCapacityKVA: 200 },
      status: 'good',
      bookValue: 18000000000,
      purchaseDate: new Date('2017-08-01'),
      purchaseCost: 22000000000,
      expectedLifeYrs: 25,
      lifecycleStatus: 'operational',
    },
  });

  // ── Medan ──
  const assetKantorMedan = await prisma.asset.create({
    data: {
      name: 'Kantor Regional FMS Medan',
      type: 'office',
      location: 'Jl. Gatot Subroto No. 212, Medan',
      specs: { floors: 2, landAreaSqm: 500, buildingAreaSqm: 900, powerCapacityKVA: 150 },
      status: 'good',
      bookValue: 12000000000,
      purchaseDate: new Date('2019-02-10'),
      purchaseCost: 15000000000,
      expectedLifeYrs: 25,
      lifecycleStatus: 'operational',
    },
  });

  const assetACMedan = await prisma.asset.create({
    data: {
      name: 'AC Precision Server Room Medan',
      type: 'facility',
      location: 'Server Room Lt. 1, Kantor Medan',
      specs: { brand: 'Daikin VRV IV', capacityKW: 56, refrigerant: 'R410A' },
      status: 'good',
      bookValue: 320000000,
      purchaseDate: new Date('2022-11-15'),
      purchaseCost: 350000000,
      expectedLifeYrs: 10,
      lifecycleStatus: 'operational',
    },
  });

  const assetPopMedan = await prisma.asset.create({
    data: {
      name: 'PoP Shelter Medan Amplas',
      type: 'facility',
      location: 'Jl. Sisingamangaraja, Medan Amplas, Medan',
      specs: { type: 'PoP Shelter', rackUnits: 42, powerCapacityKVA: 25 },
      status: 'good',
      bookValue: 800000000,
      purchaseDate: new Date('2020-06-01'),
      purchaseCost: 950000000,
      expectedLifeYrs: 15,
      lifecycleStatus: 'operational',
    },
  });

  // ── Surabaya ──
  const assetKantorSurabaya = await prisma.asset.create({
    data: {
      name: 'Kantor Regional FMS Surabaya',
      type: 'office',
      location: 'Jl. Basuki Rahmat No. 88, Surabaya',
      specs: { floors: 3, landAreaSqm: 700, buildingAreaSqm: 1800, powerCapacityKVA: 250 },
      status: 'good',
      bookValue: 22000000000,
      purchaseDate: new Date('2016-05-20'),
      purchaseCost: 28000000000,
      expectedLifeYrs: 30,
      lifecycleStatus: 'operational',
    },
  });

  const assetAvanzaSurabaya = await prisma.asset.create({
    data: {
      name: 'Toyota Avanza Operasional Surabaya',
      type: 'vehicle',
      location: 'Pool Kendaraan, Kantor Surabaya',
      specs: { model: 'Toyota Avanza 1.5 G MT', licensePlate: 'L 1234 AB', year: 2023, color: 'Silver' },
      status: 'good',
      bookValue: 180000000,
      purchaseDate: new Date('2023-03-10'),
      purchaseCost: 235000000,
      expectedLifeYrs: 8,
      lifecycleStatus: 'operational',
    },
  });

  const assetGensetSurabaya = await prisma.asset.create({
    data: {
      name: 'Genset Perkins 500 kVA Surabaya',
      type: 'facility',
      location: 'Ruang Genset, Kantor Surabaya',
      specs: { brand: 'Perkins', engineModel: '2506C-E15TAG2', capacityKVA: 500 },
      status: 'good',
      bookValue: 650000000,
      purchaseDate: new Date('2021-01-15'),
      purchaseCost: 750000000,
      expectedLifeYrs: 15,
      lifecycleStatus: 'operational',
    },
  });

  // Also add the Hilux vehicle for Jakarta
  const assetHiluxJkt = await prisma.asset.create({
    data: {
      name: 'Toyota Hilux Operasional DC',
      type: 'vehicle',
      location: 'Pool Kendaraan, Jakarta Pusat',
      specs: { model: 'Toyota Hilux Double Cabin 4x4', licensePlate: 'B 9102 SQA', year: 2024, color: 'Black Metallic' },
      status: 'good',
      bookValue: 450000000,
      purchaseDate: new Date('2024-01-15'),
      purchaseCost: 520000000,
      expectedLifeYrs: 8,
      lifecycleStatus: 'operational',
    },
  });

  console.log('Created 12 Assets across 4 regions');

  // ────────────────────────────────────────────────────────
  // 4. ASSET TRANSFERS
  // ────────────────────────────────────────────────────────
  await prisma.assetTransfer.create({
    data: {
      assetId: assetHiluxJkt.id,
      fromLocation: 'Kantor Pusat Menara Thamrin',
      toLocation: 'Pool Kendaraan, Jakarta Pusat',
      transferredBy: 'admin@lintasarta.co.id',
      notes: 'Pemindahan unit kendaraan operasional.',
    },
  });

  // ────────────────────────────────────────────────────────
  // 5. LEGAL DOCUMENTS — Multi-Regional
  // ────────────────────────────────────────────────────────

  // ── Bandung / Jatiluhur ──
  await prisma.legalDocument.create({
    data: {
      assetId: assetJatiluhur.id,
      title: 'Sertifikat Laik Fungsi (SLF) Jatiluhur',
      documentType: 'slf',
      documentUrl: '/api/docs/legal/slf_jatiluhur_2026.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      expiryDate: new Date(now.getFullYear() + 4, now.getMonth(), now.getDate()),
      complianceStatus: 'valid',
      regNumber: 'SLF-32.02.1928-001',
      issuingAuthority: 'Kemen PUPR - Dinas Cipta Karya',
    },
  });

  await prisma.legalDocument.create({
    data: {
      assetId: assetJatiluhur.id,
      title: 'Persetujuan Bangunan Gedung (PBG) Jatiluhur',
      documentType: 'pbg_imb',
      documentUrl: '/api/docs/legal/pbg_jatiluhur_2020.pdf',
      issueDate: new Date('2020-04-12'),
      expiryDate: new Date('2040-04-12'),
      complianceStatus: 'valid',
      regNumber: 'PBG-32.02.1522-004',
      issuingAuthority: 'Pemkab Purwakarta',
    },
  });

  await prisma.legalDocument.create({
    data: {
      assetId: assetJatiluhur.id,
      title: 'Izin Proteksi Kebakaran Gedung DC Jatiluhur',
      documentType: 'fire_protection',
      documentUrl: '/api/docs/legal/fire_protection_dc.pdf',
      issueDate: new Date('2024-01-15'),
      expiryDate: new Date('2027-01-14'),
      complianceStatus: 'valid',
      regNumber: 'IPK-32.02-2024-018',
      issuingAuthority: 'Dinas Damkar Purwakarta',
    },
  });

  await prisma.legalDocument.create({
    data: {
      assetId: assetKantorBandung.id,
      title: 'PBG/IMB Kantor Regional Bandung',
      documentType: 'pbg_imb',
      documentUrl: '/uploads/docs/pbg_bandung.pdf',
      issueDate: new Date('2017-06-20'),
      expiryDate: new Date('2037-06-20'),
      complianceStatus: 'valid',
      regNumber: 'PBG-32.73.001-2017',
      issuingAuthority: 'Dinas PUPR Kota Bandung',
    },
  });

  await prisma.legalDocument.create({
    data: {
      assetId: assetKantorBandung.id,
      title: 'Pajak PBB Kantor Bandung 2026',
      documentType: 'tax_building',
      documentUrl: '/uploads/docs/pbb_bandung_2026.pdf',
      issueDate: new Date('2026-01-15'),
      expiryDate: new Date('2026-12-31'),
      complianceStatus: 'valid',
    },
  });

  // ── Medan ──
  await prisma.legalDocument.create({
    data: {
      assetId: assetKantorMedan.id,
      title: 'Sertifikat Laik Fungsi (SLF) Kantor Medan',
      documentType: 'slf',
      documentUrl: '/uploads/docs/slf_medan_2026.pdf',
      issueDate: new Date('2024-03-01'),
      expiryDate: new Date('2029-03-01'),
      complianceStatus: 'valid',
      regNumber: 'SLF-12.71-2024-005',
      issuingAuthority: 'Dinas PUPR Kota Medan',
    },
  });

  const expWarningMedan = new Date();
  expWarningMedan.setDate(now.getDate() + 18);
  await prisma.legalDocument.create({
    data: {
      assetId: assetKantorMedan.id,
      title: 'Polis Asuransi Kebakaran Kantor Medan',
      documentType: 'insurance',
      documentUrl: '/uploads/docs/insurance_medan.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 18),
      expiryDate: expWarningMedan,
      complianceStatus: 'warning',
    },
  });

  // ── Surabaya ──
  await prisma.legalDocument.create({
    data: {
      assetId: assetKantorSurabaya.id,
      title: 'Sertifikat Laik Fungsi (SLF) Kantor Surabaya',
      documentType: 'slf',
      documentUrl: '/uploads/docs/slf_surabaya_2025.pdf',
      issueDate: new Date('2023-06-10'),
      expiryDate: new Date('2028-06-10'),
      complianceStatus: 'valid',
      regNumber: 'SLF-35.78-2023-012',
      issuingAuthority: 'Dinas PUPR Kota Surabaya',
    },
  });

  await prisma.legalDocument.create({
    data: {
      assetId: assetKantorSurabaya.id,
      title: 'Izin Proteksi Kebakaran Kantor Surabaya',
      documentType: 'fire_protection',
      documentUrl: '/uploads/docs/fire_surabaya.pdf',
      issueDate: new Date('2025-01-20'),
      expiryDate: new Date('2028-01-19'),
      complianceStatus: 'valid',
      regNumber: 'IPK-35.78-2025-003',
      issuingAuthority: 'Dinas Damkar Kota Surabaya',
    },
  });

  const expExpiredSby = new Date();
  expExpiredSby.setDate(now.getDate() - 10);
  await prisma.legalDocument.create({
    data: {
      assetId: assetAvanzaSurabaya.id,
      title: 'Pajak Kendaraan Tahunan (PKB) Avanza Surabaya',
      documentType: 'tax_vehicle',
      documentUrl: '/uploads/docs/pkb_avanza_sby.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 10),
      expiryDate: expExpiredSby,
      complianceStatus: 'expired',
    },
  });

  // ── Jakarta ──
  const expWarningJkt = new Date();
  expWarningJkt.setDate(now.getDate() + 20);
  await prisma.legalDocument.create({
    data: {
      assetId: assetHiluxJkt.id,
      title: 'Pajak Kendaraan Tahunan (PKB) Hilux B 9102 SQA',
      documentType: 'tax_vehicle',
      documentUrl: '/api/docs/legal/pkb_hilux_2026.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 20),
      expiryDate: expWarningJkt,
      complianceStatus: 'warning',
    },
  });

  const expExpiredJkt = new Date();
  expExpiredJkt.setDate(now.getDate() - 15);
  await prisma.legalDocument.create({
    data: {
      assetId: assetGensetBandung.id,
      title: 'Polis Asuransi Kerusakan Genset CAT Backup A',
      documentType: 'insurance',
      documentUrl: '/api/docs/legal/ins_genset_cat_a.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 15),
      expiryDate: expExpiredJkt,
      complianceStatus: 'expired',
    },
  });

  console.log('Created 12 Legal Documents across 4 regions');

  // ────────────────────────────────────────────────────────
  // 6. NOTIFICATIONS
  // ────────────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      recipientEmail: 'regional.bandung@lintasarta.co.id',
      type: 'email',
      title: 'PERINGATAN: Asuransi Genset Expired',
      message: `Polis Asuransi Kerusakan Genset CAT Backup A telah habis masa berlakunya. Segera koordinasi perpanjangan.`,
      status: 'pending',
      scheduledAt: now,
    },
  });

  await prisma.notification.create({
    data: {
      recipientEmail: 'regional.medan@lintasarta.co.id',
      type: 'email',
      title: 'PENGINGAT: Asuransi Kantor Medan Mendekati Jatuh Tempo',
      message: `Polis Asuransi Kebakaran Kantor Medan akan habis dalam 18 hari. Harap siapkan dokumen perpanjangan.`,
      status: 'sent',
      scheduledAt: new Date(now.getTime() - 86400000),
      sentAt: now,
    },
  });

  await prisma.notification.create({
    data: {
      recipientEmail: 'regional.surabaya@lintasarta.co.id',
      type: 'email',
      title: 'PERINGATAN: PKB Avanza Surabaya Expired',
      message: `Pajak Kendaraan Avanza L 1234 AB sudah expired 10 hari lalu. Segera perpanjang STNK.`,
      status: 'pending',
      scheduledAt: now,
    },
  });

  // ────────────────────────────────────────────────────────
  // 7. EMPLOYEES — Multi-Regional
  // ────────────────────────────────────────────────────────

  // ── Bandung / Jatiluhur ──
  await prisma.employee.create({
    data: {
      nip: 'LA-BDG-001', name: 'Budi Santoso', role: 'teknisi_mep', department: 'Engineering',
      phone: '0812-3456-7890', email: 'budi.santoso@lintasarta.co.id',
      joinDate: new Date('2020-03-15'), contractType: 'permanent', status: 'active',
      baseSalary: 7200000, skills: ['HVAC', 'Electrical', 'Chiller Presisi'],
    }
  });
  await prisma.employee.create({
    data: {
      nip: 'LA-BDG-002', name: 'Andi Prasetyo', role: 'operator_bas', department: 'Engineering',
      phone: '0838-2211-4433', email: 'andi.prasetyo@lintasarta.co.id',
      joinDate: new Date('2023-02-01'), contractType: 'permanent', status: 'active',
      baseSalary: 7800000, skills: ['BAS', 'BACnet', 'Modbus', 'Telemetry'],
    }
  });
  await prisma.employee.create({
    data: {
      nip: 'LA-BDG-003', name: 'Rudi Hartono', role: 'security', department: 'Security',
      phone: '0821-9988-7766', email: 'rudi.hartono@lintasarta.co.id',
      joinDate: new Date('2021-01-10'), contractType: 'outsource', status: 'active',
      baseSalary: 5200000, skills: ['Security Patrol', 'Fire Safety', 'First Aid'],
      gadaLevel: 'pratama', ktaNumber: 'KTA-POLRI-109281',
      ktaExpiry: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
    }
  });

  // ── Medan ──
  await prisma.employee.create({
    data: {
      nip: 'LA-MDN-001', name: 'Syahrul Ramadhan', role: 'teknisi_mep', department: 'Engineering',
      phone: '0812-6543-2100', email: 'syahrul.r@lintasarta.co.id',
      joinDate: new Date('2021-07-01'), contractType: 'permanent', status: 'active',
      baseSalary: 6800000, skills: ['HVAC', 'Plumbing', 'Generator'],
    }
  });
  await prisma.employee.create({
    data: {
      nip: 'LA-MDN-002', name: 'Dani Lubis', role: 'security', department: 'Security',
      phone: '0813-7788-1122', email: 'dani.lubis@lintasarta.co.id',
      joinDate: new Date('2022-03-15'), contractType: 'outsource', status: 'active',
      baseSalary: 4800000, skills: ['Patrol', 'CCTV Monitoring'],
      gadaLevel: 'pratama', ktaNumber: 'KTA-POLRI-120055',
      ktaExpiry: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
    }
  });

  // ── Surabaya ──
  await prisma.employee.create({
    data: {
      nip: 'LA-SBY-001', name: 'Agus Widodo', role: 'teknisi_mep', department: 'Engineering',
      phone: '0811-3322-4455', email: 'agus.widodo@lintasarta.co.id',
      joinDate: new Date('2019-11-01'), contractType: 'permanent', status: 'active',
      baseSalary: 7000000, skills: ['Electrical', 'Panel MDP', 'Generator'],
    }
  });
  await prisma.employee.create({
    data: {
      nip: 'LA-SBY-002', name: 'Hendra Wijaya', role: 'security', department: 'Security',
      phone: '0811-7788-9900', email: 'hendra.wijaya@lintasarta.co.id',
      joinDate: new Date('2019-05-10'), contractType: 'outsource', status: 'active',
      baseSalary: 5500000, skills: ['CCTV Monitoring', 'Access Control', 'First Aid'],
      gadaLevel: 'madya', ktaNumber: 'KTA-POLRI-100293',
      ktaExpiry: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
    }
  });

  console.log('Created 7 Employees across 3 regions');

  // ────────────────────────────────────────────────────────
  // 8. INVENTORY — Multi-Regional (lokasi gudang per region)
  // ────────────────────────────────────────────────────────

  // ── Bandung / Jatiluhur ──
  await prisma.inventoryItem.create({
    data: {
      sku: 'BDG-FILT-AHU-01', name: 'Filter Udara AHU Data Center',
      category: 'spare_part', qty: 24, minQty: 10, maxQty: 50, unit: 'pcs',
      location: 'Gudang MEP Lt. 1, Jatiluhur — Bandung', unitPrice: 185000,
    }
  });
  await prisma.inventoryItem.create({
    data: {
      sku: 'BDG-EL-MCB-16A', name: 'MCB Schneider 16A 3-Phase',
      category: 'electrical', qty: 4, minQty: 8, maxQty: 20, unit: 'pcs',
      location: 'Gudang MEP Lt. 1, Jatiluhur — Bandung', unitPrice: 420000,
    }
  });
  await prisma.inventoryItem.create({
    data: {
      sku: 'BDG-SF-HELM-W', name: 'Safety Helmet Krisbow White (Visitor)',
      category: 'safety_ppe', qty: 35, minQty: 15, maxQty: 40, unit: 'pcs',
      location: 'Rak HSE Pos Satpam, Jatiluhur — Bandung', unitPrice: 95000,
    }
  });

  // ── Medan ──
  await prisma.inventoryItem.create({
    data: {
      sku: 'MDN-FILT-AC-01', name: 'Filter AC Daikin VRV IV',
      category: 'spare_part', qty: 8, minQty: 5, maxQty: 20, unit: 'pcs',
      location: 'Gudang MEP, Kantor Medan', unitPrice: 165000,
    }
  });
  await prisma.inventoryItem.create({
    data: {
      sku: 'MDN-APAR-CO2', name: 'APAR CO2 6kg Tabung',
      category: 'safety_ppe', qty: 3, minQty: 4, maxQty: 10, unit: 'pcs',
      location: 'Gudang HSE, Kantor Medan', unitPrice: 850000,
    }
  });

  // ── Surabaya ──
  await prisma.inventoryItem.create({
    data: {
      sku: 'SBY-EL-KABEL-NYM', name: 'Kabel NYM 3x2.5mm 100m',
      category: 'electrical', qty: 12, minQty: 5, maxQty: 25, unit: 'roll',
      location: 'Gudang MEP, Kantor Surabaya', unitPrice: 520000,
    }
  });
  await prisma.inventoryItem.create({
    data: {
      sku: 'SBY-GENSET-OLI', name: 'Oli Mesin Genset SAE 15W-40 (20L)',
      category: 'consumable', qty: 2, minQty: 3, maxQty: 8, unit: 'pcs',
      location: 'Gudang Genset, Kantor Surabaya', unitPrice: 1200000,
    }
  });

  console.log('Created 7 Inventory Items across 3 regions');

  // ────────────────────────────────────────────────────────
  // 9. SMK3 ITEMS — Multi-Regional
  // ────────────────────────────────────────────────────────
  await prisma.smk3Item.create({
    data: { item: 'APAR CO2 6kg', location: 'Koridor Depan Data Center Lt. 1, Jatiluhur — Bandung', lastChecked: new Date('2026-05-15'), status: 'ok', checkedBy: 'Rudi Hartono' }
  });
  await prisma.smk3Item.create({
    data: { item: 'Instalasi Grounding Genset Backup A', location: 'Power Station Room, Jatiluhur — Bandung', lastChecked: new Date('2026-06-01'), status: 'warning', checkedBy: 'Budi Santoso' }
  });
  await prisma.smk3Item.create({
    data: { item: 'APAR Powder 3kg', location: 'Lobby Lt. 1, Kantor Medan', lastChecked: new Date('2026-06-10'), status: 'ok', checkedBy: 'Dani Lubis' }
  });
  await prisma.smk3Item.create({
    data: { item: 'Smoke Detector Panel', location: 'Ruang Server Lt. 1, Kantor Surabaya', lastChecked: new Date('2026-05-25'), status: 'ok', checkedBy: 'Hendra Wijaya' }
  });
  await prisma.smk3Item.create({
    data: { item: 'Hydrant Box', location: 'Tangga Darurat Lt. 2, Kantor Surabaya', lastChecked: new Date('2026-04-20'), status: 'warning', checkedBy: 'Agus Widodo' }
  });

  console.log('Created 5 SMK3 Items across 3 regions');

  // ────────────────────────────────────────────────────────
  // 10. RAB BUDGETS — Terpisah per Regional
  // ────────────────────────────────────────────────────────

  // ── Bandung ──
  const rabEngBdg = await prisma.rabBudget.create({
    data: { year: 2026, department: 'Engineering — Bandung', category: 'Opex', allocatedAmount: 1800000000, spentAmount: 0 }
  });
  const rabSecBdg = await prisma.rabBudget.create({
    data: { year: 2026, department: 'Security — Bandung', category: 'Operasional', allocatedAmount: 720000000, spentAmount: 0 }
  });

  // ── Medan ──
  const rabEngMdn = await prisma.rabBudget.create({
    data: { year: 2026, department: 'Engineering — Medan', category: 'Opex', allocatedAmount: 650000000, spentAmount: 0 }
  });
  const rabSecMdn = await prisma.rabBudget.create({
    data: { year: 2026, department: 'Security — Medan', category: 'Operasional', allocatedAmount: 280000000, spentAmount: 0 }
  });

  // ── Surabaya ──
  const rabEngSby = await prisma.rabBudget.create({
    data: { year: 2026, department: 'Engineering — Surabaya', category: 'Opex', allocatedAmount: 850000000, spentAmount: 0 }
  });
  const rabSecSby = await prisma.rabBudget.create({
    data: { year: 2026, department: 'Security — Surabaya', category: 'Operasional', allocatedAmount: 350000000, spentAmount: 0 }
  });

  console.log('Created 6 RAB Budgets across 3 regions');

  // ────────────────────────────────────────────────────────
  // 11. ACCOUNTING TRANSACTIONS — Multi-Regional
  // ────────────────────────────────────────────────────────
  await prisma.accountingTransaction.create({
    data: { date: new Date('2026-06-10'), description: 'Pembelian Filter Udara AHU Data Center Jatiluhur', type: 'expense', amount: 4440000, category: 'maintenance', rabBudgetId: rabEngBdg.id }
  });
  await prisma.accountingTransaction.create({
    data: { date: new Date('2026-06-15'), description: 'Pembayaran Tagihan Listrik Jatiluhur PLN', type: 'expense', amount: 145000000, category: 'utility', rabBudgetId: rabEngBdg.id }
  });
  await prisma.accountingTransaction.create({
    data: { date: new Date('2026-06-01'), description: 'Gaji Outsource Security Bandung Juni 2026', type: 'expense', amount: 15600000, category: 'salary', rabBudgetId: rabSecBdg.id }
  });
  await prisma.accountingTransaction.create({
    data: { date: new Date('2026-06-12'), description: 'Servis AC Daikin VRV Kantor Medan', type: 'expense', amount: 8500000, category: 'maintenance', rabBudgetId: rabEngMdn.id }
  });
  await prisma.accountingTransaction.create({
    data: { date: new Date('2026-06-05'), description: 'Gaji Outsource Security Medan Juni 2026', type: 'expense', amount: 4800000, category: 'salary', rabBudgetId: rabSecMdn.id }
  });
  await prisma.accountingTransaction.create({
    data: { date: new Date('2026-06-08'), description: 'Pembelian Kabel NYM untuk Panel MDP Surabaya', type: 'expense', amount: 6240000, category: 'maintenance', rabBudgetId: rabEngSby.id }
  });

  console.log('Created 6 Accounting Transactions across 3 regions');

  // ────────────────────────────────────────────────────────
  // 12. MAINTENANCE SCHEDULES — Multi-Regional
  // ────────────────────────────────────────────────────────
  await prisma.maintenanceSchedule.createMany({
    data: [
      // Bandung
      { assetId: assetACBandung.id, title: 'Overhaul AC Presisi Data Hall 1 Jatiluhur', intervalDays: 90, lastPerformed: new Date(now.getTime() - 60 * 86400000), nextDue: new Date(now.getTime() + 30 * 86400000), assignedTo: 'LA-BDG-001', status: 'scheduled', notes: 'Perawatan AC rutin triwulanan' },
      { assetId: assetGensetBandung.id, title: 'Inspeksi Genset CAT 1500 kVA Jatiluhur', intervalDays: 30, lastPerformed: new Date(now.getTime() - 35 * 86400000), nextDue: new Date(now.getTime() - 5 * 86400000), assignedTo: 'LA-BDG-001', status: 'overdue', notes: 'Jadwal sudah terlambat!' },
      // Medan
      { assetId: assetACMedan.id, title: 'Servis Berkala AC Server Room Medan', intervalDays: 60, lastPerformed: new Date(now.getTime() - 45 * 86400000), nextDue: new Date(now.getTime() + 15 * 86400000), assignedTo: 'LA-MDN-001', status: 'scheduled', notes: 'Servis 2 bulan sekali' },
      // Surabaya
      { assetId: assetGensetSurabaya.id, title: 'Inspeksi Genset Perkins 500 kVA Surabaya', intervalDays: 30, lastPerformed: new Date(now.getTime() - 28 * 86400000), nextDue: new Date(now.getTime() + 2 * 86400000), assignedTo: 'LA-SBY-001', status: 'scheduled', notes: 'Inspeksi bulanan' },
      { assetId: assetAvanzaSurabaya.id, title: 'Servis Kendaraan Avanza Surabaya', intervalDays: 120, lastPerformed: new Date(now.getTime() - 30 * 86400000), nextDue: new Date(now.getTime() + 90 * 86400000), status: 'scheduled' },
    ],
  });
  console.log('Created 5 Maintenance Schedules across 3 regions');

  // ────────────────────────────────────────────────────────
  // 13. VENDOR CONTRACTS — Per Regional
  // ────────────────────────────────────────────────────────
  await prisma.vendorContract.createMany({
    data: [
      // Bandung
      { vendorName: 'PT Daikin Service Indonesia', contractTitle: 'Kontrak Perawatan AC Presisi Jatiluhur 2026', contractType: 'maintenance', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), value: 450000000, pic: 'regional.bandung@lintasarta.co.id', status: 'active', notes: 'Regional Bandung — Jatiluhur DC' },
      { vendorName: 'PT ABB Power Grids', contractTitle: 'Kalibrasi UPS & PDU Annual Jatiluhur', contractType: 'service', startDate: new Date('2026-03-01'), endDate: new Date('2027-02-28'), value: 280000000, pic: 'regional.bandung@lintasarta.co.id', status: 'active', notes: 'Regional Bandung' },
      { vendorName: 'PT Asuransi Adira Dinamika', contractTitle: 'Asuransi Gedung Data Center Jatiluhur', contractType: 'insurance', startDate: new Date('2025-06-01'), endDate: new Date('2026-07-15'), value: 150000000, pic: 'regional.bandung@lintasarta.co.id', status: 'expiring', notes: 'Regional Bandung — Akan jatuh tempo bulan depan' },
      // Medan
      { vendorName: 'PT Carrier AC Indonesia', contractTitle: 'Kontrak Perawatan AC Kantor Medan', contractType: 'maintenance', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), value: 85000000, pic: 'regional.medan@lintasarta.co.id', status: 'active', notes: 'Regional Medan' },
      { vendorName: 'PT Jasa Raharja Security', contractTitle: 'Outsource Security Kantor Medan', contractType: 'service', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), value: 120000000, pic: 'regional.medan@lintasarta.co.id', status: 'active', notes: 'Regional Medan' },
      // Surabaya
      { vendorName: 'PT Perkins Power Indonesia', contractTitle: 'Kontrak Perawatan Genset Kantor Surabaya', contractType: 'maintenance', startDate: new Date('2026-02-01'), endDate: new Date('2027-01-31'), value: 95000000, pic: 'regional.surabaya@lintasarta.co.id', status: 'active', notes: 'Regional Surabaya' },
      { vendorName: 'PT Graha Sarana Duta', contractTitle: 'Sewa Ruang Kantor Surabaya Lt.3', contractType: 'lease', startDate: new Date('2024-01-01'), endDate: new Date('2026-12-31'), value: 480000000, pic: 'regional.surabaya@lintasarta.co.id', status: 'active', notes: 'Regional Surabaya' },
    ],
  });
  console.log('Created 7 Vendor Contracts across 3 regions');

  // ────────────────────────────────────────────────────────
  // 14. WORK ORDERS — Multi-Regional
  // ────────────────────────────────────────────────────────
  await prisma.workOrder.createMany({
    data: [
      // Bandung
      { ticketNumber: 'WO-2026-0001', title: 'AC Presisi Data Hall 1 Jatiluhur Overheat', description: 'Suhu Cold Aisle melebihi 27°C. AC Presisi Unit 3 tidak dingin optimal. Perlu pengecekan refrigerant.', priority: 'critical', category: 'hvac', assetId: assetACBandung.id, assignedTo: 'LA-BDG-001', reportedBy: 'regional.bandung@lintasarta.co.id', status: 'open', slaDeadline: new Date(now.getTime() + 4 * 3600000) },
      { ticketNumber: 'WO-2026-0002', title: 'Lampu Emergency Exit Lt.2 Mati — Jatiluhur', description: 'Lampu penanda jalur evakuasi lantai 2 sayap barat tidak menyala.', priority: 'high', category: 'electrical', assetId: assetJatiluhur.id, reportedBy: 'teknisi.bandung@lintasarta.co.id', status: 'in_progress', assignedTo: 'LA-BDG-002' },
      // Medan
      { ticketNumber: 'WO-2026-0003', title: 'Kebocoran Pipa Air Toilet Lt.1 Kantor Medan', description: 'Pipa air di toilet pria lantai 1 bocor kecil, sudah ditampung ember.', priority: 'medium', category: 'plumbing', assetId: assetKantorMedan.id, reportedBy: 'teknisi.medan@lintasarta.co.id', status: 'resolved', resolvedAt: new Date(now.getTime() - 2 * 86400000), assignedTo: 'LA-MDN-001' },
      // Surabaya
      { ticketNumber: 'WO-2026-0004', title: 'Genset Surabaya Gagal Start Otomatis', description: 'Genset Perkins 500 kVA gagal melakukan auto-start saat PLN trip. Perlu pengecekan ATS panel.', priority: 'high', category: 'electrical', assetId: assetGensetSurabaya.id, reportedBy: 'regional.surabaya@lintasarta.co.id', status: 'open', assignedTo: 'LA-SBY-001' },
    ],
  });
  console.log('Created 4 Work Orders across 3 regions');

  // ────────────────────────────────────────────────────────
  // 15. AUDIT LOG
  // ────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      user: 'superadmin@lintasarta.co.id',
      action: 'SEED_DATABASE_COMPLETE',
      resource: 'System',
      details: 'Sistem berhasil di-seeding dengan data multi-regional (Jakarta, Medan, Bandung, Surabaya).',
    },
  });

  // ────────────────────────────────────────────────────────
  // 16. MASTER DATA (48 items across 9 categories)
  // ────────────────────────────────────────────────────────
  const masterDataEntries = [
    // asset_type (7)
    { category: 'asset_type', code: 'building', label: 'Gedung / Bangunan', description: 'Properti gedung dan bangunan', sortOrder: 1 },
    { category: 'asset_type', code: 'vehicle', label: 'Kendaraan', description: 'Kendaraan operasional', sortOrder: 2 },
    { category: 'asset_type', code: 'it_equipment', label: 'Peralatan IT', description: 'Server, network, komputer', sortOrder: 3 },
    { category: 'asset_type', code: 'mep', label: 'MEP (Mekanikal, Elektrikal, Plumbing)', description: 'Sistem MEP gedung', sortOrder: 4 },
    { category: 'asset_type', code: 'furniture', label: 'Furnitur & Perabot', description: 'Meja, kursi, lemari', sortOrder: 5 },
    { category: 'asset_type', code: 'tool', label: 'Alat & Perkakas', description: 'Tools teknis operasional', sortOrder: 6 },
    { category: 'asset_type', code: 'other', label: 'Lainnya', description: 'Aset kategori lain', sortOrder: 7 },

    // facility_type (7)
    { category: 'facility_type', code: 'data_center', label: 'Data Center', description: 'Fasilitas pusat data', sortOrder: 1 },
    { category: 'facility_type', code: 'office', label: 'Ruang Kantor', description: 'Ruang kerja perkantoran', sortOrder: 2 },
    { category: 'facility_type', code: 'warehouse', label: 'Gudang', description: 'Tempat penyimpanan', sortOrder: 3 },
    { category: 'facility_type', code: 'power_room', label: 'Power Room / Genset', description: 'Ruang panel dan genset', sortOrder: 4 },
    { category: 'facility_type', code: 'meeting_room', label: 'Ruang Rapat', description: 'Ruang meeting dan konferensi', sortOrder: 5 },
    { category: 'facility_type', code: 'lobby', label: 'Lobby & Resepsionis', description: 'Area penerimaan tamu', sortOrder: 6 },
    { category: 'facility_type', code: 'parking', label: 'Area Parkir', description: 'Lahan parkir kendaraan', sortOrder: 7 },

    // region (4) — NEW
    { category: 'region', code: 'jakarta', label: 'Jakarta (Pusat)', description: 'Kantor Pusat Lintasarta — Menara Thamrin', sortOrder: 1 },
    { category: 'region', code: 'medan', label: 'Medan (Sumatera Utara)', description: 'Regional FMS Medan', sortOrder: 2 },
    { category: 'region', code: 'bandung', label: 'Bandung (Jawa Barat)', description: 'Regional FMS Bandung — termasuk Jatiluhur', sortOrder: 3 },
    { category: 'region', code: 'surabaya', label: 'Surabaya (Jawa Timur)', description: 'Regional FMS Surabaya', sortOrder: 4 },

    // location (10) — EXPANDED
    { category: 'location', code: 'hq_thamrin', label: 'Menara Thamrin Lt. 9, Jakarta', description: 'Kantor Pusat Lintasarta', sortOrder: 1 },
    { category: 'location', code: 'jatiluhur', label: 'Technopark Jatiluhur, Purwakarta', description: 'Stasiun Bumi & Data Center (Regional Bandung)', sortOrder: 2 },
    { category: 'location', code: 'bandung_office', label: 'Kantor Regional Bandung', description: 'Jl. Braga No. 45, Bandung', sortOrder: 3 },
    { category: 'location', code: 'bandung_dc', label: 'Data Center Mini Bandung', description: 'DC regional Bandung', sortOrder: 4 },
    { category: 'location', code: 'medan_office', label: 'Kantor Regional Medan', description: 'Jl. Gatot Subroto No. 212, Medan', sortOrder: 5 },
    { category: 'location', code: 'medan_pop', label: 'PoP Medan Amplas', description: 'Titik kehadiran Medan selatan', sortOrder: 6 },
    { category: 'location', code: 'surabaya_office', label: 'Kantor Regional Surabaya', description: 'Jl. Basuki Rahmat No. 88, Surabaya', sortOrder: 7 },
    { category: 'location', code: 'surabaya_pop', label: 'PoP Surabaya Rungkut', description: 'Titik kehadiran Surabaya timur', sortOrder: 8 },

    // document_type (7)
    { category: 'document_type', code: 'slf', label: 'Sertifikat Laik Fungsi (SLF)', description: 'SLF dari Kemen PUPR', sortOrder: 1 },
    { category: 'document_type', code: 'pbg_imb', label: 'Persetujuan Bangunan Gedung (PBG/IMB)', description: 'Izin mendirikan bangunan', sortOrder: 2 },
    { category: 'document_type', code: 'fire_protection', label: 'Izin Proteksi Kebakaran', description: 'Sertifikasi sistem proteksi kebakaran', sortOrder: 3 },
    { category: 'document_type', code: 'insurance', label: 'Polis Asuransi', description: 'Asuransi aset / gedung', sortOrder: 4 },
    { category: 'document_type', code: 'tax_vehicle', label: 'Pajak Kendaraan (PKB/STNK)', description: 'Perpanjangan STNK tahunan', sortOrder: 5 },
    { category: 'document_type', code: 'k3', label: 'Sertifikasi K3 / SMK3', description: 'Sertifikat keselamatan kerja', sortOrder: 6 },
    { category: 'document_type', code: 'environmental', label: 'Izin Lingkungan (AMDAL)', description: 'Analisis dampak lingkungan', sortOrder: 7 },

    // asset_status (5)
    { category: 'asset_status', code: 'good', label: 'Baik', description: 'Kondisi aset sangat baik', sortOrder: 1 },
    { category: 'asset_status', code: 'warning', label: 'Perlu Perhatian', description: 'Ada indikasi perlu pengecekan', sortOrder: 2 },
    { category: 'asset_status', code: 'maintenance', label: 'Dalam Perbaikan', description: 'Sedang dalam proses maintenance', sortOrder: 3 },
    { category: 'asset_status', code: 'critical', label: 'Kritis', description: 'Kondisi kritis, butuh tindakan segera', sortOrder: 4 },
    { category: 'asset_status', code: 'retired', label: 'Pensiun / Disposal', description: 'Aset sudah tidak aktif', sortOrder: 5 },

    // department (5)
    { category: 'department', code: 'engineering', label: 'Engineering / MEP', description: 'Tim teknis mekanikal elektrikal', sortOrder: 1 },
    { category: 'department', code: 'security', label: 'Security', description: 'Tim keamanan gedung', sortOrder: 2 },
    { category: 'department', code: 'general_affairs', label: 'General Affairs (GA)', description: 'Tim administrasi umum', sortOrder: 3 },
    { category: 'department', code: 'it', label: 'IT & Network', description: 'Tim infrastruktur IT', sortOrder: 4 },
    { category: 'department', code: 'finance', label: 'Finance & Accounting', description: 'Tim keuangan', sortOrder: 5 },

    // maintenance_type (4)
    { category: 'maintenance_type', code: 'preventive', label: 'Preventive Maintenance', description: 'Perawatan terjadwal rutin', sortOrder: 1 },
    { category: 'maintenance_type', code: 'corrective', label: 'Corrective Maintenance', description: 'Perbaikan setelah kerusakan', sortOrder: 2 },
    { category: 'maintenance_type', code: 'predictive', label: 'Predictive Maintenance', description: 'Berdasarkan kondisi & monitoring', sortOrder: 3 },
    { category: 'maintenance_type', code: 'overhaul', label: 'Overhaul / Major Service', description: 'Servis besar periodik', sortOrder: 4 },

    // vendor_category (4)
    { category: 'vendor_category', code: 'maintenance_vendor', label: 'Vendor Maintenance', description: 'Penyedia layanan perawatan', sortOrder: 1 },
    { category: 'vendor_category', code: 'supplier', label: 'Supplier Material', description: 'Pemasok suku cadang & material', sortOrder: 2 },
    { category: 'vendor_category', code: 'insurance_vendor', label: 'Perusahaan Asuransi', description: 'Penyedia asuransi aset', sortOrder: 3 },
    { category: 'vendor_category', code: 'contractor', label: 'Kontraktor / Jasa', description: 'Jasa konstruksi dan renovasi', sortOrder: 4 },
  ];

  for (const entry of masterDataEntries) {
    await prisma.masterData.upsert({
      where: { category_code: { category: entry.category, code: entry.code } },
      update: { label: entry.label, description: entry.description, sortOrder: entry.sortOrder },
      create: { ...entry, isActive: true },
    });
  }
  console.log(`Seeded ${masterDataEntries.length} MasterData entries across 9 categories (incl. region)`);

  console.log('\n✅ Database seeding completed successfully!');
  console.log('   Regions: Jakarta (Pusat), Medan, Bandung (+ Jatiluhur), Surabaya');
  console.log('   Users: 12 (3 pusat + 3×3 regional)');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
