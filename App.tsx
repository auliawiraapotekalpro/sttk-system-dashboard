import React, { useState, useEffect, useCallback } from 'react';
import { KpiView } from './components/KpiView';
import { DashboardOverview } from './components/Dashboard';
import { AddDataView } from './components/AddDataView';
import { DataSttkView } from './components/DataSttkView';
import { Login } from './components/Login';
import { ManagerDashboard } from './components/ManagerDashboard';
import { User } from './types';
import { SttkEntry } from './hooks/useMockData';
import {
  LayoutDashboard, Database, Trophy, PlusCircle, Menu, Download, Check, LogOut, BarChartBig
} from 'lucide-react';
import { getAllReports, approveSttkReport, exportReportsAsXLS } from './services/apiService';
import * as XLSX from 'xlsx';

type View = 'dashboard' | 'dataSttk' | 'kpi' | 'addData' | 'managerDashboard';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [sttkData, setSttkData] = useState<SttkEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const reports = await getAllReports();
      setSttkData(reports);
    } catch (error) {
      console.error("Failed to load reports:", error);
      alert("Gagal memuat data dari server. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user, fetchReports]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    if (loggedInUser.role === 'Manager') {
      setCurrentView('managerDashboard');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUser(null);
  };
  
  const handleReportSubmitted = () => {
    alert('Laporan berhasil dikirim dan menunggu approval Manager.');
    fetchReports();
    if (user?.role === 'Manager') {
      setCurrentView('dataSttk');
    }
  };
  
  const handleApproveSttk = async (id: string | number) => {
    const success = await approveSttkReport(id);
    if (success) {
      setSttkData(currentData =>
        currentData.map(entry =>
          entry.id === id ? { ...entry, status: 'Verified' } : entry
        )
      );
    } else {
      alert("Gagal menyetujui laporan. Silakan coba lagi.");
    }
  };

  const handleExportXLS = async () => {
    try {
      const csvData = await exportReportsAsXLS();
      
      // Parse CSV data. This creates a workbook object.
      const workbook = XLSX.read(csvData, { type: 'string', raw: true });

      // Generate XLSX file and trigger download
      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `STTK_Reports_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to export XLSX:", error);
      alert("Gagal mengunduh file XLSX.");
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const amNavItems: { view: View; label: string; icon: React.ElementType }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { view: 'addData', label: 'Tambah Data', icon: PlusCircle },
  ];
  
  const managerNavItems: { view: View; label: string; icon: React.ElementType }[] = [
    { view: 'managerDashboard', label: 'Manager Dashboard', icon: BarChartBig },
    { view: 'dataSttk', label: 'Semua Data STTK', icon: Database },
    { view: 'kpi', label: 'Analisis KPI', icon: Trophy },
  ];

  const navItems = user.role === 'Manager' ? managerNavItems : amNavItems;

  const NavButton: React.FC<{ view: View, label: string, icon: React.ElementType }> = ({ view, label, icon: Icon }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      <Icon size={20} className="mr-3" />
      <span>{label}</span>
    </button>
  );

  const CurrentView = () => {
      switch (currentView) {
          case 'dashboard': return <DashboardOverview />;
          case 'managerDashboard': return <ManagerDashboard sttkData={sttkData} />;
          case 'dataSttk': return <DataSttkView sttkData={sttkData} onApprove={handleApproveSttk} isLoading={isLoading} />;
          case 'kpi': return <KpiView sttkData={sttkData} />;
          case 'addData': return <AddDataView onReportSubmitted={handleReportSubmitted} />;
          default: return user.role === 'Manager' ? <ManagerDashboard sttkData={sttkData} /> : <DashboardOverview />;
      }
  };

  return (
    <div className="min-h-screen flex text-gray-800 bg-slate-100">
      <aside className="w-64 bg-white p-4 flex flex-col shadow-lg z-10">
          <div className="bg-white p-4 rounded-xl">
            <h2 className="flex items-center text-sm font-semibold text-gray-500 mb-4 px-2">
                <Menu size={16} className="mr-2" />
                Menu
            </h2>
            <nav className="flex flex-col gap-2">
                {navItems.map(item => <NavButton key={item.view} view={item.view} label={item.label} icon={item.icon} />)}
            </nav>
          </div>
          <div className="mt-auto p-2">
              <div className="text-center text-sm font-medium text-gray-700">{user.username}</div>
              <div className="text-center text-xs text-gray-400">{user.role}</div>
          </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
            <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-600 rounded-md text-white">
                    <Check size={16} strokeWidth={3}/>
                </div>
                <h1 className="text-xl font-bold text-gray-800 tracking-tight">STTK Management System</h1>
            </div>
            <div className="flex items-center gap-4">
                 <button 
                    onClick={handleExportXLS}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg shadow-sm hover:bg-green-700 transition-colors">
                    <Download size={16}/>
                    Export XLSX
                </button>
                 <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 transition-colors">
                    <LogOut size={16}/>
                    Logout
                </button>
            </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto">
          <CurrentView />
        </main>
      </div>
    </div>
  );
};

export default App;