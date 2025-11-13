import React, { useMemo } from 'react';
import { Card } from './ui/Card';
import { SttkEntry } from '../hooks/useMockData';
import { Award, UserX, AlertCircle, Trophy } from 'lucide-react';

interface KpiViewProps {
  sttkData: SttkEntry[];
}

interface KpiData {
  amSubmissions: { am: string; count: number }[];
  lowAccuracyStores: { store: string; accuracy: string }[];
  amWithoutSubmissions: string[];
}

const ALL_AM_OPTIONS = [
  'ADE IRMA S. A.',
  'APRIANA LUMBAN GAOL',
  'AULIALOLA GALUS',
  'BAID SION BR SINAGA',
  'CAMELIA FITRIANI',
  'FUNNA ANINDYA',
  'GENY SARASWATI',
  'HANNA DOLI BR KABAN',
  'ISMA LESTARI',
  'JEPPARIA M SIREGAR',
  'JESIKA SILITONGA',
  'JULAINI',
  'LELIANA OKTAVIA SARAGIH',
  'LINDA NOVAWATI S',
  'NARTA LENA GINTING',
  'NUR ADE ARYANI',
  'RYAN ADILA',
  'SANNAULI SIAHAAN',
  'SITI NURLAILA',
  'SUSI SUKAESIH'
];

export const KpiView: React.FC<KpiViewProps> = ({ sttkData }) => {

  const kpiData = useMemo((): KpiData => {
    if (!sttkData) {
      return { amSubmissions: [], lowAccuracyStores: [], amWithoutSubmissions: ALL_AM_OPTIONS };
    }

    // 1. AM dengan Jumlah STTK Tertinggi
    // Fix: Explicitly typing the accumulator for the reduce function to ensure 'submissionsByAm' has the correct type Record<string, number>. This resolves type errors in subsequent operations that rely on the 'count' property being a number.
    const submissionsByAm = sttkData.reduce((acc: Record<string, number>, entry: SttkEntry) => {
      acc[entry.namaAM] = (acc[entry.namaAM] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const amSubmissions = Object.entries(submissionsByAm)
      .map(([am, count]) => ({ am, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4); // Ambil 4 teratas

    // 2. Toko Akurasi Terendah (berdasarkan denda varians)
    const lowAccuracyStores = sttkData
      .filter((entry: SttkEntry) => entry.varianceDetails && entry.varianceDetails.denda > 0)
      .sort((a: SttkEntry, b: SttkEntry) => Number(b.varianceDetails!.denda) - Number(a.varianceDetails!.denda))
      .slice(0, 3) // Ambil 3 teratas
      .map(entry => {
          const totalDendaNonZero = Number(entry.totalDenda) || 1; // Hindari pembagian dengan nol
          const inaccuracyPercentage = (Number(entry.varianceDetails!.denda) / totalDendaNonZero) * 100;
          return {
              store: entry.namaToko,
              // Tampilkan persentase denda varians terhadap total denda
              accuracy: `${inaccuracyPercentage.toFixed(2)}%`, 
          }
      });

    // 3. AM Belum Input STTK
    const submittedAm = new Set(sttkData.map(entry => entry.namaAM));
    const amWithoutSubmissions = ALL_AM_OPTIONS.filter(am => !submittedAm.has(am));

    return { amSubmissions, lowAccuracyStores, amWithoutSubmissions };
  }, [sttkData]);

  return (
    <div className="space-y-6">
       <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <Trophy size={24}/>
          Analisis KPI
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 text-green-700 rounded-full">
              <Award size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">AM dengan Jumlah STTK Tertinggi</h3>
          </div>
          <ul className="space-y-3">
            {kpiData.amSubmissions.length > 0 ? kpiData.amSubmissions.map(({ am, count }, index) => (
              <li key={am} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700">{index + 1}. {am}</span>
                <span className="px-3 py-1 text-sm font-bold text-green-800 bg-green-200 rounded-full">{count} STTK</span>
              </li>
            )) : <p className="text-gray-500 text-center p-4">Belum ada data laporan.</p>}
          </ul>
        </Card>

        <Card className="lg:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-yellow-100 text-yellow-700 rounded-full">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Toko Akurasi Terendah</h3>
          </div>
          <ul className="space-y-3">
            {kpiData.lowAccuracyStores.length > 0 ? kpiData.lowAccuracyStores.map(({ store, accuracy }) => (
              <li key={store} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-semibold text-gray-700 truncate" title={store}>{store}</span>
                <span className="px-3 py-1 text-sm font-bold text-yellow-800 bg-yellow-200 rounded-full flex-shrink-0">{accuracy}</span>
              </li>
            )) : <p className="text-gray-500 text-center p-4">Tidak ada toko dengan denda akurasi.</p>}
          </ul>
        </Card>

        <Card className="lg:col-span-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 text-red-700 rounded-full">
              <UserX size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800">AM Belum Input STTK</h3>
          </div>
          <ul className="space-y-3">
            {kpiData.amWithoutSubmissions.length > 0 ? kpiData.amWithoutSubmissions.map(am => (
              <li key={am} className="p-3 bg-gray-50 rounded-lg font-semibold text-gray-700">
                {am}
              </li>
            )) : (
              <p className="text-gray-500 text-center p-4">Semua AM sudah melakukan input.</p>
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
};
