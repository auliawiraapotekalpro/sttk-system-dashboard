import { useState, useEffect } from 'react';

// Mock data structures based on component usage
interface AmSubmission {
  am: string;
  count: number;
}

interface LowAccuracyStore {
  store: string;
  accuracy: string;
}

interface KpiData {
  amSubmissions: AmSubmission[];
  lowAccuracyStores: LowAccuracyStore[];
  amWithoutSubmissions: string[];
}

export interface SttkEntry {
  id: number;
  namaAM: string;
  area: string;
  namaToko: string;
  tanggalSttk: string;
  status: 'Verified' | 'Pending';

  // Details for modal view
  lossDetails: {
    selisihPlus: number;
    selisihMinus: number;
    edAwal: number;
    edAkhir: number;
    dendaAkhir: number;
  };
  varianceDetails: {
    nilaiPlus: number;
    nilaiMinus: number;
    edAwal: number;
    total: number;
    kategori: string;
    denda: number;
  };
  totalDenda: number;
  penaltyDistribution: {
    nama: string;
    jabatan: string;
    masaKerja: string;
    jumlahDenda: number;
  }[];
  files: {
    bap: string;
    expiredList: string;
    photos: string[];
  };
}


interface DashboardData {
  totalOutlets: number;
  totalSelisihPlus: number;
  totalSelisihMinus: number;
  totalVariance: number;
  dataByArea: { name: string; value: number }[];
  dataByAreaManager: { name: string; value: number }[];
}

interface ManagerDashboardData {
  totalSubmissions: number;
  pendingVerification: number;
  submissionTrend: { month: string; count: number }[];
  amPerformance: { name: string; submissions: number; onTime: number; pending: number }[];
}

interface ProcessedData {
  kpiData: KpiData;
  dashboardData: DashboardData;
  managerDashboardData: ManagerDashboardData;
  allSttkData: SttkEntry[];
}

// Generate mock data
const mockSttkEntries: SttkEntry[] = Array.from({ length: 25 }, (_, i) => {
  const ams = ['Geny', 'Aulia', 'Jesika', 'Budi Santoso'];
  const areas = ['Jakarta Barat', 'Bandung', 'Depok', 'Bekasi', 'Jakarta Pusat', 'Tangerang'];
  const tokoNames = ['Alpro Sabang', 'Guardian PIM', 'Century AEON', 'Kimia Farma Tebet', 'Watsons Gancit', 'Boston Blok M'];
  const am = ams[i % ams.length];

  const lossDenda = (i % 3 + 1) * -1250000;
  const varianceDenda = (i % 2) * 500000;
  const totalDenda = lossDenda + varianceDenda;

  return {
    id: i + 1,
    namaAM: am,
    area: areas[i % areas.length],
    namaToko: `${tokoNames[i % tokoNames.length]} #${i + 1}`,
    tanggalSttk: `2024-05-${String(28 - i).padStart(2, '0')}`,
    status: i % 5 === 0 ? 'Pending' : 'Verified',
    
    // Detailed Data
    lossDetails: {
        selisihPlus: 2000000,
        selisihMinus: -500000,
        edAwal: -3000000,
        edAkhir: -2100000, // 70% of edAwal
        dendaAkhir: lossDenda,
    },
    varianceDetails: {
        nilaiPlus: 8000000,
        nilaiMinus: -1000000,
        edAwal: 2000000,
        total: 9000000,
        kategori: 'B',
        denda: varianceDenda,
    },
    totalDenda: totalDenda,
    penaltyDistribution: [
        { nama: am, jabatan: 'Area Manager', masaKerja: '> 3 bulan', jumlahDenda: totalDenda * 0.1 },
        { nama: `BM Toko ${i + 1}`, jabatan: 'Branch Manager (BM)', masaKerja: '> 3 bulan', jumlahDenda: totalDenda * 0.35 },
        { nama: `Karyawan A`, jabatan: 'Health Advisor (HA)', masaKerja: '< 3 bulan', jumlahDenda: totalDenda * 0.275 },
        { nama: `Karyawan B`, jabatan: 'Asistent Apoteker (AA)', masaKerja: '> 3 bulan', jumlahDenda: totalDenda * 0.275 },
    ],
    files: {
        bap: `BAP_STTK_${i+1}.pdf`,
        expiredList: `Expired_List_${i+1}.xlsx`,
        photos: [`IMG_001.jpg`, `IMG_002.jpg`],
    }
  };
});

const mockKpiData: KpiData = {
  amSubmissions: [
    { am: 'Geny', count: 8 },
    { am: 'Aulia', count: 7 },
    { am: 'Jesika', count: 6 },
    { am: 'Budi Santoso', count: 4 },
  ],
  lowAccuracyStores: [
    { store: 'Toko Maju Jaya', accuracy: '0.08%' },
    { store: 'Sumber Rejeki', accuracy: '0.05%' },
    { store: 'Warung Kita', accuracy: '0.09%' },
  ],
  amWithoutSubmissions: ['Fajar Nugraha'],
};

const mockDashboardData: DashboardData = {
  totalOutlets: 10,
  totalSelisihPlus: 310000,
  totalSelisihMinus: -599626,
  totalVariance: 1240753,
  dataByArea: [
    { name: 'JAKARTA SELATAN', value: 2 },
    { name: 'BEKASI', value: 1 },
    { name: 'DEPOK', value: 1 },
    { name: 'JAKARTA BARAT', value: 1 },
    { name: 'JAKARTA PUSAT', value: 1 },
    { name: 'JAKARTA TIMUR', value: 1 },
    { name: 'TANGERANG', value: 1 },
    { name: 'TANGERANG SELATAN', value: 1 },
  ],
  dataByAreaManager: [
    { name: 'ANDI WIJAYA', value: 2 },
    { name: 'BUDI SANTOSO', value: 2 },
    { name: 'DEWI LESTARI', value: 2 },
    { name: 'GENY SARASWATI', value: 2 },
    { name: 'SITI NURHALIZA', value: 2 },
  ],
};

const mockManagerDashboardData: ManagerDashboardData = {
    totalSubmissions: 134,
    pendingVerification: mockSttkEntries.filter(e => e.status === 'Pending').length,
    submissionTrend: [
        { month: 'Jan', count: 20 },
        { month: 'Feb', count: 25 },
        { month: 'Mar', count: 30 },
        { month: 'Apr', count: 28 },
        { month: 'Mei', count: 31 },
    ],
    amPerformance: [
        { name: 'Geny', submissions: 8, onTime: 7, pending: 1 },
        { name: 'Aulia', submissions: 7, onTime: 7, pending: 0 },
        { name: 'Jesika', submissions: 6, onTime: 5, pending: 1 },
        { name: 'Budi Santoso', submissions: 4, onTime: 3, pending: 1 },
    ]
};


const MOCK_PROCESSED_DATA: ProcessedData = {
  kpiData: mockKpiData,
  dashboardData: mockDashboardData,
  managerDashboardData: mockManagerDashboardData,
  allSttkData: mockSttkEntries,
};

export const useMockData = () => {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setProcessedData(MOCK_PROCESSED_DATA);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return { loading, processedData };
};