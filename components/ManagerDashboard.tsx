import React, { useMemo } from 'react';
import { Card } from './ui/Card';
import { SttkEntry } from '../hooks/useMockData';
import {
  BarChartBig,
  PackageCheck,
  TrendingUp,
  UserCheck,
  FileClock,
} from 'lucide-react';

interface ManagerDashboardProps {
  sttkData: SttkEntry[];
}

interface AmPerformance {
  name: string;
  total: number;
  verified: number;
  pending: number;
  masaKerja: string;
}

const StatCard = ({ title, value, icon: Icon, color, description }: { title: string, value: number, icon: React.ElementType, color: string, description: string }) => (
  <Card className="flex items-center gap-6">
    <div className={`p-4 rounded-full ${color}`}>
      <Icon size={28} className="text-white" />
    </div>
    <div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  </Card>
);

const TrendChart = ({ data }: { data: { month: string, count: number }[] }) => {
  const maxValue = data.length > 0 ? Math.max(...data.map(d => d.count)) : 1;
  return (
    <div className="h-64 w-full flex items-end gap-4 px-4 pt-4 border-l border-b border-gray-200">
      {data.map(item => (
        <div key={item.month} className="w-full flex flex-col items-center gap-2">
           <span className="text-xs font-semibold text-gray-700">{item.count}</span>
           <div 
             className="w-full bg-blue-500 rounded-t-md hover:bg-blue-600 transition-colors"
             style={{ height: `${(item.count / maxValue) * 80}%` }}
             title={`${item.month}: ${item.count} submissions`}
           ></div>
           <span className="text-xs font-medium text-gray-500">{item.month}</span>
        </div>
      ))}
    </div>
  );
};

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ sttkData }) => {
  
  const dashboardStats = useMemo(() => {
    if (!sttkData || sttkData.length === 0) {
      return {
        totalSubmissionsThisMonth: 0,
        pendingVerification: 0,
        activeAMs: 0,
        submissionTrend: [],
        amPerformance: [],
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Total Pengiriman Bulan Ini
    const totalSubmissionsThisMonth = sttkData.filter(entry => {
      const entryDate = new Date(entry.tanggalSttk);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    }).length;

    // 2. Laporan Menunggu Verifikasi
    const pendingVerification = sttkData.filter(e => e.status === 'Pending').length;

    // 3. AM Aktif
    const activeAMs = new Set(sttkData.map(e => e.namaAM)).size;

    // 4. Performa Area Manager
    // Fix: Explicitly typing the accumulator for the reduce function to ensure 'performance' has the correct type Record<string, AmPerformance>. This allows properties like 'total' to be accessed safely in subsequent operations, resolving the 'property does not exist on type unknown' error.
    const performance = sttkData.reduce((acc: Record<string, AmPerformance>, entry) => {
      if (!acc[entry.namaAM]) {
        const amPenaltyInfo = entry.penaltyDistribution?.find(p => p.jabatan === 'Area Manager');
        const masaKerja = amPenaltyInfo ? amPenaltyInfo.masaKerja : 'N/A';
        acc[entry.namaAM] = { name: entry.namaAM, total: 0, verified: 0, pending: 0, masaKerja };
      }
      acc[entry.namaAM].total++;
      if (entry.status === 'Verified') {
        acc[entry.namaAM].verified++;
      } else {
        acc[entry.namaAM].pending++;
      }
      return acc;
    }, {} as Record<string, AmPerformance>);

    // 5. Tren Pengiriman (5 bulan terakhir)
    const trend = Array.from({ length: 5 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      return {
        month: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        count: 0,
      };
    }).reverse();

    sttkData.forEach(entry => {
      const entryDate = new Date(entry.tanggalSttk);
      const entryMonth = entryDate.toLocaleString('default', { month: 'short' });
      const entryYear = entryDate.getFullYear();
      const monthData = trend.find(m => m.month === entryMonth && m.year === entryYear);
      if (monthData) {
        monthData.count++;
      }
    });

    return {
      totalSubmissionsThisMonth,
      pendingVerification,
      activeAMs,
      submissionTrend: trend,
      amPerformance: Object.values(performance).sort((a, b) => b.total - a.total),
    };

  }, [sttkData]);

  return (
    <div className="space-y-6">
       <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <BarChartBig size={24}/>
            Manager Dashboard
        </h2>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Pengiriman" value={dashboardStats.totalSubmissionsThisMonth} icon={PackageCheck} color="bg-blue-500" description="Total laporan STTK bulan ini" />
        <StatCard title="Menunggu Verifikasi" value={dashboardStats.pendingVerification} icon={FileClock} color="bg-yellow-500" description="Laporan yang butuh approval" />
        <StatCard title="AM Aktif" value={dashboardStats.activeAMs} icon={UserCheck} color="bg-green-500" description="Area Manager yang mengirim laporan" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} /> Tren Pengiriman Laporan
          </h3>
          <TrendChart data={dashboardStats.submissionTrend} />
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Performa Area Manager</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead className="text-left text-gray-500">
                    <tr>
                        <th className="p-2 font-semibold">Nama AM</th>
                        <th className="p-2 font-semibold">Masa Kerja</th>
                        <th className="p-2 font-semibold text-center">Total</th>
                        <th className="p-2 font-semibold text-center">Verified</th>
                        <th className="p-2 font-semibold text-center">Pending</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {dashboardStats.amPerformance.map(am => (
                        <tr key={am.name}>
                            <td className="p-2 font-medium text-gray-800">{am.name}</td>
                            <td className="p-2 text-gray-600">{am.masaKerja}</td>
                            <td className="p-2 text-center font-bold text-gray-700">{am.total}</td>
                            <td className="p-2 text-center text-green-600 font-medium">{am.verified}</td>
                            <td className="p-2 text-center text-yellow-600 font-medium">{am.pending}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
