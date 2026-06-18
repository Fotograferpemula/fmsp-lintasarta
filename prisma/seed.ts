import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear existing data
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.legalDocument.deleteMany({});
  await prisma.assetTransfer.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.user.deleteMany({});

  // Clear management tables
  await prisma.accountingTransaction.deleteMany({});
  await prisma.rabBudget.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.inventoryItem.deleteMany({});
  await prisma.smk3Item.deleteMany({});
  // Clear Phase 2 tables
  await prisma.workOrder.deleteMany({});
  await prisma.maintenanceSchedule.deleteMany({});
  await prisma.vendorContract.deleteMany({});

  // 2. Create Users (6-tier RBAC)
  const bcryptHash = '$2b$10$TA2McBvTqbg30o8mTDdgNueigSu4CMRGUyMkYllEC6PJ38w9.fhz.'; // admin123

  const superadmin = await prisma.user.create({
    data: {
      email: 'superadmin@lintasarta.co.id',
      name: 'System SuperAdmin',
      role: 'superadmin',
      department: 'IT',
      passwordHash: bcryptHash,
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

  const adminRegional = await prisma.user.create({
    data: {
      email: 'regional.jatiluhur@lintasarta.co.id',
      name: 'Andi Prasetyo',
      role: 'admin_regional',
      department: 'FM',
      region: 'Jatiluhur, Purwakarta, Jawa Barat',
      passwordHash: bcryptHash,
    },
  });

  const adminLokasi = await prisma.user.create({
    data: {
      email: 'lokasi.dc1@lintasarta.co.id',
      name: 'Dewi Lestari',
      role: 'admin_lokasi',
      department: 'FM',
      region: 'Data Center Lantai 1, Jatiluhur',
      passwordHash: bcryptHash,
    },
  });

  const userBiasa = await prisma.user.create({
    data: {
      email: 'operator@lintasarta.co.id',
      name: 'FMSP Operator',
      role: 'user',
      department: 'Engineering',
      region: 'Jatiluhur, Purwakarta, Jawa Barat',
      passwordHash: bcryptHash,
    },
  });

  console.log('Created 6 Users (RBAC):', {
    superadmin: superadmin.email,
    manager: manager.email,
    adminPusat: adminPusat.email,
    adminRegional: adminRegional.email,
    adminLokasi: adminLokasi.email,
    user: userBiasa.email,
  });

  // 3. Create Assets
  const asset1 = await prisma.asset.create({
    data: {
      name: 'Gedung Technopark Lintasarta Jatiluhur',
      type: 'office',
      location: 'Jatiluhur, Purwakarta, Jawa Barat',
      specs: {
        floors: 3,
        landAreaSqm: 12000,
        buildingAreaSqm: 8500,
        powerCapacityKVA: 5000,
      },
      status: 'good',
      bookValue: 125000000000,
      purchaseDate: new Date('2015-03-20'),
      purchaseCost: 140000000000,
      expectedLifeYrs: 30,
      lifecycleStatus: 'operational',
    },
  });

  const asset2 = await prisma.asset.create({
    data: {
      name: 'Precision AC AHU-DC01 (Lantai 1)',
      type: 'facility',
      location: 'Data Center Room A, Jatiluhur',
      specs: {
        brand: 'Liebert DSE',
        capacityKW: 120,
        redundancy: 'N+1',
        refrigerant: 'R410A',
        serialNumber: 'LBT-2025-00918',
      },
      status: 'good',
      bookValue: 750000000,
      purchaseDate: new Date('2023-05-20'),
      purchaseCost: 750000000,
      expectedLifeYrs: 10,
      lifecycleStatus: 'operational',
    },
  });

  const asset3 = await prisma.asset.create({
    data: {
      name: 'Genset Caterpillar 1500 kVA (Backup A)',
      type: 'facility',
      location: 'Power Station Room, Jatiluhur',
      specs: {
        brand: 'Caterpillar',
        engineModel: '3512B',
        fuelType: 'Diesel',
        fuelCapacityLiters: 5000,
        lastOverhaulHours: 1200,
      },
      status: 'warning',
      bookValue: 2400000000,
      purchaseDate: new Date('2018-09-01'),
      purchaseCost: 2400000000,
      expectedLifeYrs: 15,
      lifecycleStatus: 'operational',
    },
  });

  const asset4 = await prisma.asset.create({
    data: {
      name: 'Toyota Hilux Operasional DC',
      type: 'vehicle',
      location: 'Pool Jatiluhur',
      specs: {
        model: 'Toyota Hilux Double Cabin 4x4',
        licensePlate: 'B 9102 SQA',
        year: 2024,
        color: 'Black Metallic',
      },
      status: 'good',
      bookValue: 450000000,
      purchaseDate: new Date('2024-01-15'),
      purchaseCost: 520000000,
      expectedLifeYrs: 8,
      lifecycleStatus: 'operational',
    },
  });

  console.log('Created Assets:', [asset1.name, asset2.name, asset3.name, asset4.name]);

  // 4. Create Asset Transfers
  await prisma.assetTransfer.create({
    data: {
      assetId: asset4.id,
      fromLocation: 'Kantor Pusat Menara Thamrin',
      toLocation: 'Pool Jatiluhur',
      transferredBy: 'admin@lintasarta.co.id',
      notes: 'Pemindahan unit kendaraan operasional untuk kebutuhan survei teknis di Jatiluhur.',
    },
  });

  // 5. Create Legal Documents
  const now = new Date();

  // Valid Document (SLF Jatiluhur)
  const docValid = await prisma.legalDocument.create({
    data: {
      assetId: asset1.id,
      title: 'Sertifikat Laik Fungsi (SLF) Jatiluhur',
      documentType: 'slf',
      documentUrl: '/uploads/docs/slf_jatiluhur_2026.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      expiryDate: new Date(now.getFullYear() + 4, now.getMonth(), now.getDate()),
      complianceStatus: 'valid',
      regNumber: 'SLF-32.02.1928-001',
      issuingAuthority: 'Kemen PUPR - Dinas Cipta Karya',
    },
  });

  // Warning Document (Pajak Kendaraan Hilux - Expiring in 20 days)
  const expWarning = new Date();
  expWarning.setDate(now.getDate() + 20);
  const docWarning = await prisma.legalDocument.create({
    data: {
      assetId: asset4.id,
      title: 'Pajak Kendaraan Tahunan (PKB) Hilux B 9102 SQA',
      documentType: 'tax_vehicle',
      documentUrl: '/uploads/docs/pkb_hilux_2026.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 20),
      expiryDate: expWarning,
      complianceStatus: 'warning',
    },
  });

  // Expired Document (Asuransi Kebakaran Genset - Expired 15 days ago)
  const expExpired = new Date();
  expExpired.setDate(now.getDate() - 15);
  const docExpired = await prisma.legalDocument.create({
    data: {
      assetId: asset3.id,
      title: 'Polis Asuransi Kerusakan Genset CAT Backup A',
      documentType: 'insurance',
      documentUrl: '/uploads/docs/ins_genset_cat_a.pdf',
      issueDate: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 15),
      expiryDate: expExpired,
      complianceStatus: 'expired',
    },
  });

  console.log('Created Legal Documents:', [docValid.title, docWarning.title, docExpired.title]);

  // 6. Create Notifications
  await prisma.notification.create({
    data: {
      recipientEmail: 'admin@lintasarta.co.id',
      type: 'email',
      title: 'PERINGATAN: Asuransi Aset Expired',
      message: `Polis Asuransi Kerusakan Genset CAT Backup A telah habis masa berlakunya pada tanggal ${expExpired.toLocaleDateString('id-ID')}. Segera lakukan koordinasi dengan broker asuransi untuk perpanjangan.`,
      status: 'pending',
      scheduledAt: now,
    },
  });

  await prisma.notification.create({
    data: {
      recipientEmail: 'operator@lintasarta.co.id',
      type: 'email',
      title: 'PENGINGAT: Pajak Kendaraan Hilux Mendekati Jatuh Tempo',
      message: `Pajak Tahunan Kendaraan Hilux B 9102 SQA akan habis pada ${expWarning.toLocaleDateString('id-ID')} (20 hari lagi). Harap siapkan dokumen perpanjangan STNK.`,
      status: 'sent',
      scheduledAt: new Date(now.getTime() - 86400000),
      sentAt: now,
    },
  });
  // Tambahan LegalDocument untuk PUPR (merged from PuprDocument)
  await prisma.legalDocument.create({
    data: {
      assetId: asset1.id,
      title: 'Persetujuan Bangunan Gedung (PBG) Jatiluhur',
      documentType: 'pbg_imb',
      documentUrl: '/uploads/docs/pbg_jatiluhur_2020.pdf',
      issueDate: new Date('2020-04-12'),
      expiryDate: new Date('2040-04-12'),
      complianceStatus: 'valid',
      regNumber: 'PBG-32.02.1522-004',
      issuingAuthority: 'Pemkab Purwakarta',
    },
  });
  await prisma.legalDocument.create({
    data: {
      assetId: asset1.id,
      title: 'Izin Proteksi Kebakaran Gedung DC',
      documentType: 'fire_protection',
      documentUrl: '/uploads/docs/fire_protection_dc.pdf',
      issueDate: new Date('2024-01-15'),
      expiryDate: new Date('2027-01-14'),
      complianceStatus: 'valid',
      regNumber: 'IPK-32.02-2024-018',
      issuingAuthority: 'Dinas Damkar Purwakarta',
    },
  });

  // 7. Seed Management tables
  
  // A. HRD (Employees — includes Security Guards)
  await prisma.employee.create({
    data: {
      nip: 'LA-2026-001',
      name: 'Budi Santoso',
      role: 'teknisi_mep',
      department: 'Engineering',
      phone: '0812-3456-7890',
      email: 'budi.santoso@lintasarta.co.id',
      joinDate: new Date('2020-03-15'),
      contractType: 'permanent',
      status: 'active',
      baseSalary: 7200000,
      skills: ['HVAC', 'Electrical', 'Chiller Presisi'],
    }
  });
  await prisma.employee.create({
    data: {
      nip: 'LA-2026-002',
      name: 'Andi Prasetyo',
      role: 'operator_bas',
      department: 'Engineering',
      phone: '0838-2211-4433',
      email: 'andi.prasetyo@lintasarta.co.id',
      joinDate: new Date('2023-02-01'),
      contractType: 'permanent',
      status: 'active',
      baseSalary: 7800000,
      skills: ['BAS', 'BACnet', 'Modbus', 'Telemetry'],
    }
  });
  await prisma.employee.create({
    data: {
      nip: 'LA-2026-003',
      name: 'Rudi Hartono',
      role: 'security',
      department: 'Security',
      phone: '0821-9988-7766',
      email: 'rudi.hartono@lintasarta.co.id',
      joinDate: new Date('2021-01-10'),
      contractType: 'outsource',
      status: 'active',
      baseSalary: 5200000,
      skills: ['Security Patrol', 'Fire Safety', 'First Aid'],
      gadaLevel: 'pratama',
      ktaNumber: 'KTA-POLRI-109281',
      ktaExpiry: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
    }
  });
  // Security Guard merged as Employee
  await prisma.employee.create({
    data: {
      nip: 'LA-2026-004',
      name: 'Hendra Wijaya',
      role: 'security',
      department: 'Security',
      phone: '0811-7788-9900',
      email: 'hendra.wijaya@lintasarta.co.id',
      joinDate: new Date('2019-05-10'),
      contractType: 'outsource',
      status: 'active',
      baseSalary: 5500000,
      skills: ['CCTV Monitoring', 'Access Control', 'First Aid'],
      gadaLevel: 'madya',
      ktaNumber: 'KTA-POLRI-100293',
      ktaExpiry: new Date(now.getFullYear() + 2, now.getMonth(), now.getDate()),
    }
  });
  await prisma.employee.create({
    data: {
      nip: 'LA-2026-005',
      name: 'Rian Hidayat',
      role: 'security',
      department: 'Security',
      phone: '0813-2233-4455',
      email: 'rian.hidayat@lintasarta.co.id',
      joinDate: new Date('2022-09-15'),
      contractType: 'outsource',
      status: 'active',
      baseSalary: 5000000,
      skills: ['Patrol', 'Emergency Response'],
      gadaLevel: 'pratama',
      ktaNumber: 'KTA-POLRI-109282',
      ktaExpiry: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()),
    }
  });

  // C. Inventory Items
  await prisma.inventoryItem.create({
    data: {
      sku: 'SP-FILT-AHU-01',
      name: 'Filter Udara AHU Data Center',
      category: 'spare_part',
      qty: 24,
      minQty: 10,
      maxQty: 50,
      unit: 'pcs',
      location: 'Gudang MEP Lt. 1',
      unitPrice: 185000,
    }
  });
  await prisma.inventoryItem.create({
    data: {
      sku: 'EL-MCB-16A-3P',
      name: 'MCB Schneider 16A 3-Phase',
      category: 'electrical',
      qty: 4, // low stock
      minQty: 8,
      maxQty: 20,
      unit: 'pcs',
      location: 'Gudang MEP Lt. 1',
      unitPrice: 420000,
    }
  });
  await prisma.inventoryItem.create({
    data: {
      sku: 'SF-HELM-WHITE',
      name: 'Safety Helmet Krisbow White (Visitor)',
      category: 'safety_ppe',
      qty: 35,
      minQty: 15,
      maxQty: 40,
      unit: 'pcs',
      location: 'Rak HSE Pos Satpam',
      unitPrice: 95000,
    }
  });

  // D. SMK3 Items
  await prisma.smk3Item.create({
    data: {
      item: 'APAR CO2 6kg',
      location: 'Koridor Depan Data Center Lt. 1',
      lastChecked: new Date('2026-05-15'),
      status: 'ok',
      checkedBy: 'Hendra Wijaya',
    }
  });
  await prisma.smk3Item.create({
    data: {
      item: 'Instalasi Grounding Genset Backup A',
      location: 'Power Station Room',
      lastChecked: new Date('2026-06-01'),
      status: 'warning',
      checkedBy: 'Budi Santoso',
    }
  });

  // E. Accounting Transactions — now with RAB relation
  const rabEng = await prisma.rabBudget.create({
    data: {
      year: 2026,
      department: 'Engineering',
      category: 'Opex',
      allocatedAmount: 1800000000,
      spentAmount: 0, // Will be computed from transactions
    }
  });
  const rabSec = await prisma.rabBudget.create({
    data: {
      year: 2026,
      department: 'Security',
      category: 'Operasional',
      allocatedAmount: 720000000,
      spentAmount: 0,
    }
  });

  await prisma.accountingTransaction.create({
    data: {
      date: new Date('2026-06-10'),
      description: 'Pembelian Filter Udara AHU Data Center',
      type: 'expense',
      amount: 4440000,
      category: 'maintenance',
      rabBudgetId: rabEng.id,
    }
  });
  await prisma.accountingTransaction.create({
    data: {
      date: new Date('2026-06-15'),
      description: 'Pembayaran Tagihan Listrik Jatiluhur PLN',
      type: 'expense',
      amount: 145000000,
      category: 'utility',
      rabBudgetId: rabEng.id,
    }
  });
  await prisma.accountingTransaction.create({
    data: {
      date: new Date('2026-06-01'),
      description: 'Gaji Outsource Security Juni 2026',
      type: 'expense',
      amount: 15600000,
      category: 'salary',
      rabBudgetId: rabSec.id,
    }
  });

  console.log('Seeded Management tables (consolidated) successfully!');

  // 8. Create Audit Log
  await prisma.auditLog.create({
    data: {
      user: 'admin@lintasarta.co.id',
      action: 'SEED_DATABASE_COMPLETE',
      resource: 'System',
      details: 'Sistem berhasil di-seeding dengan data modul lengkap (Phase 1 + Phase 2).',
    },
  });

  // 9. Seed Maintenance Schedules (Phase 2B)\n  // (reuses 'now' from line 132)
  await prisma.maintenanceSchedule.createMany({
    data: [
      { assetId: asset1.id, title: 'Overhaul AC Presisi Data Hall 1', intervalDays: 90, lastPerformed: new Date(now.getTime() - 60 * 86400000), nextDue: new Date(now.getTime() + 30 * 86400000), assignedTo: 'FM-001', status: 'scheduled', notes: 'Perawatan AC rutin triwulanan' },
      { assetId: asset2.id, title: 'Kalibrasi UPS 3-Phase', intervalDays: 180, lastPerformed: new Date(now.getTime() - 150 * 86400000), nextDue: new Date(now.getTime() + 30 * 86400000), assignedTo: 'FM-002', status: 'scheduled', notes: 'Kalibrasi semesteran' },
      { assetId: asset3.id, title: 'Inspeksi Genset Diesel 2000 KVA', intervalDays: 30, lastPerformed: new Date(now.getTime() - 35 * 86400000), nextDue: new Date(now.getTime() - 5 * 86400000), assignedTo: 'FM-001', status: 'overdue', notes: 'Jadwal sudah terlambat!' },
      { assetId: asset4.id, title: 'Servis Kendaraan Dinas Rute Jawa', intervalDays: 120, lastPerformed: new Date(now.getTime() - 30 * 86400000), nextDue: new Date(now.getTime() + 90 * 86400000), status: 'scheduled' },
    ],
  });
  console.log('Created 4 Maintenance Schedules');

  // 10. Seed Vendor Contracts (Phase 2B)
  await prisma.vendorContract.createMany({
    data: [
      { vendorName: 'PT Daikin Service Indonesia', contractTitle: 'Kontrak Perawatan AC Presisi 2026', contractType: 'maintenance', startDate: new Date('2026-01-01'), endDate: new Date('2026-12-31'), value: 450000000, pic: 'admin@lintasarta.co.id', status: 'active' },
      { vendorName: 'PT ABB Power Grids', contractTitle: 'Kalibrasi UPS & PDU Annual', contractType: 'service', startDate: new Date('2026-03-01'), endDate: new Date('2027-02-28'), value: 280000000, pic: 'operator@lintasarta.co.id', status: 'active' },
      { vendorName: 'PT Asuransi Adira Dinamika', contractTitle: 'Asuransi Gedung Data Center Jatiluhur', contractType: 'insurance', startDate: new Date('2025-06-01'), endDate: new Date('2026-07-15'), value: 150000000, pic: 'admin@lintasarta.co.id', status: 'expiring', notes: 'Akan jatuh tempo bulan depan' },
      { vendorName: 'PT Graha Sarana Duta', contractTitle: 'Sewa Ruang Kantor Sudirman Lt.5', contractType: 'lease', startDate: new Date('2024-01-01'), endDate: new Date('2026-12-31'), value: 1200000000, pic: 'admin@lintasarta.co.id', status: 'active' },
    ],
  });
  console.log('Created 4 Vendor Contracts');

  // 11. Seed Work Orders (Phase 2D)
  await prisma.workOrder.createMany({
    data: [
      { ticketNumber: 'WO-2026-0001', title: 'AC Presisi Data Hall 1 Overheat', description: 'Suhu Cold Aisle melebihi 27°C. AC Presisi Unit 3 tidak dingin optimal. Perlu pengecekan refrigerant.', priority: 'critical', category: 'hvac', assetId: asset1.id, assignedTo: 'FM-001', reportedBy: 'admin@lintasarta.co.id', status: 'open', slaDeadline: new Date(now.getTime() + 4 * 3600000) },
      { ticketNumber: 'WO-2026-0002', title: 'Lampu Emergency Exit Lt.2 Mati', description: 'Lampu penanda jalur evakuasi lantai 2 sayap barat tidak menyala.', priority: 'high', category: 'electrical', assetId: asset1.id, reportedBy: 'operator@lintasarta.co.id', status: 'in_progress', assignedTo: 'FM-002' },
      { ticketNumber: 'WO-2026-0003', title: 'Kebocoran Pipa Air Di Toilet Lt.3', description: 'Pipa air di toilet pria lantai 3 bocor kecil. Sudah ditampung ember.', priority: 'medium', category: 'plumbing', reportedBy: 'operator@lintasarta.co.id', status: 'resolved', resolvedAt: new Date(now.getTime() - 2 * 86400000) },
    ],
  });
  console.log('Created 3 Work Orders');

  // 12. Seed Master Data (42 items across 8 categories)
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

    // location (6)
    { category: 'location', code: 'jatiluhur', label: 'Jatiluhur, Purwakarta', description: 'Technopark Lintasarta Jatiluhur', sortOrder: 1 },
    { category: 'location', code: 'thamrin', label: 'Menara Thamrin, Jakarta', description: 'Kantor Pusat Jakarta', sortOrder: 2 },
    { category: 'location', code: 'bandung', label: 'Bandung Office', description: 'Kantor Bandung', sortOrder: 3 },
    { category: 'location', code: 'surabaya', label: 'Surabaya Office', description: 'Kantor Surabaya', sortOrder: 4 },
    { category: 'location', code: 'dc_floor1', label: 'Data Center Lantai 1', description: 'DC Room A - Lantai 1 Jatiluhur', sortOrder: 5 },
    { category: 'location', code: 'dc_floor2', label: 'Data Center Lantai 2', description: 'DC Room B - Lantai 2 Jatiluhur', sortOrder: 6 },

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
  console.log(`Seeded ${masterDataEntries.length} MasterData entries across 8 categories`);

  console.log('Database seeding completed successfully!');

}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
