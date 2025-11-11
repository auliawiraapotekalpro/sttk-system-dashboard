import React from 'react';
import { Card } from './ui/Card';
import { useMockData } from '../hooks/useMockData';
import {
  Store,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  Map,
  Users,
  Loader2,
  AlignLeft,
} from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, gradient }: { title: string, value: number, icon: React.ElementType, gradient: string }) => (
  <div className={`p-5 rounded-xl text-white shadow-lg flex items-center justify-between relative overflow-hidden ${gradient}`}>
    <div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold">{new Intl.NumberFormat('de-DE').format(value)}</p>
    </div>
    <Icon size={48} className="opacity-50" />
  </div>
);

const BarChart = ({ data, color, legend }: { data: { name: string, value: number }[], color: string, legend: string }) => {
    const maxValue = data.reduce((max, item) => item.value > max ? item.value : max, 0);
    const yAxisSteps = [0, 1, 2];

    return (
        <div>
            <div className="flex items-center gap-2 mb-4">
                <div className={`w-4 h-4 rounded-sm ${color}`}></div>
                <span className="text-sm font-medium text-gray-600">{legend}</span>
            </div>
            <div className="h-48 flex">
                {/* Y-Axis Labels */}
                <div className="flex flex-col-reverse justify-between text-right pr-2 text-xs text-gray-500">
                    {yAxisSteps.map(step => (
                        <div key={step} className="relative h-px">
                            <span className="absolute right-2 -top-1.5">{step}</span>
                        </div>
                    ))}
                </div>
                {/* Chart and X-Axis */}
                <div className="w-full flex flex-col">
                    {/* Grid lines and Bars */}
                    <div className="flex-grow flex border-l border-gray-200">
                        <div className="w-full h-full flex flex-col-reverse justify-between relative">
                            {yAxisSteps.slice(1).map(step => (
                                <div key={`line-${step}`} className="w-full border-t border-dashed border-gray-200"></div>
                            ))}
                             <div className="absolute inset-0 flex justify-around items-end gap-2 px-2">
                                {data.map(item => (
                                    <div key={item.name} className={`w-full rounded-t-sm hover:opacity-80 transition-opacity ${color}`} style={{ height: `${(item.value / 2) * 100}%` }} title={`${item.name}: ${item.value}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* X-Axis Labels */}
                    <div className="h-16 w-full flex justify-around border-t border-gray-200 pt-1">
                        {data.map(item => (
                            <div key={item.name} className="w-full text-center">
                                <p className="text-[10px] text-gray-500 transform -rotate-45 origin-top-left whitespace-nowrap">{item.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};


export const DashboardOverview: React.FC = () => {
  const { processedData, loading } = useMockData();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  if (!processedData) {
    return (
      <Card>
        <p className="text-center text-gray-500">Gagal memuat data dashboard.</p>
      </Card>
    );
  }

  const { dashboardData } = processedData;

  return (
    <div className="space-y-6">
       <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <AlignLeft size={24}/>
            Dashboard Overview
        </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Outlets" value={dashboardData.totalOutlets} icon={Store} gradient="bg-gradient-to-br from-purple-500 to-indigo-600" />
        <StatCard title="Total Selisih (+)" value={dashboardData.totalSelisihPlus} icon={ArrowUp} gradient="bg-gradient-to-br from-pink-500 to-rose-500" />
        <StatCard title="Total Selisih (-)" value={dashboardData.totalSelisihMinus} icon={ArrowDown} gradient="bg-gradient-to-br from-cyan-400 to-blue-500" />
        <StatCard title="Total Variance" value={dashboardData.totalVariance} icon={TrendingUp} gradient="bg-gradient-to-br from-emerald-400 to-teal-500" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Map size={20} /> Data by Area
          </h3>
          <BarChart data={dashboardData.dataByArea} color="bg-blue-500" legend="Total Outlets" />
        </Card>

        <Card>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={20} /> Data by Area Manager
          </h3>
          <BarChart data={dashboardData.dataByAreaManager} color="bg-green-500" legend="Total Outlets" />
        </Card>
      </div>
    </div>
  );
};
