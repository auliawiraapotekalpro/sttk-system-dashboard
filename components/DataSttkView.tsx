
import React, { useState } from 'react';
import { Card } from './ui/Card';
import { SttkEntry } from '../hooks/useMockData';
import { Loader2, Database, CheckCircle, Check } from 'lucide-react';
import { SttkDetailModal } from './SttkDetailModal';

interface DataSttkViewProps {
  sttkData: SttkEntry[];
  onApprove: (id: string | number) => void;
  isLoading: boolean;
}

export const DataSttkView: React.FC<DataSttkViewProps> = ({ sttkData, onApprove, isLoading }) => {
  const [selectedEntry, setSelectedEntry] = useState<SttkEntry | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <>
      <Card>
        <div className="mb-6">
           <h2 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
              <Database size={24}/>
              Semua Data STTK
          </h2>
          <p className="text-gray-500 mt-1">Daftar semua laporan STTK yang telah dikirim.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama AM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Area</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Toko</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal STTK</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sttkData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">Belum ada data laporan.</td>
                </tr>
              ) : (
                sttkData.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                       <button 
                        onClick={() => setSelectedEntry(entry)}
                        className="text-blue-600 hover:text-blue-800 font-medium hover:underline transition"
                      >
                        {entry.namaAM}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{entry.area}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{entry.namaToko}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500">{entry.tanggalSttk}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {entry.status === 'Verified' ? (
                          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 cursor-default">
                              <CheckCircle size={14} className="mr-1.5"/>
                              Verified
                          </span>
                      ) : (
                          <button
                              onClick={() => onApprove(entry.id)}
                              className="inline-flex items-center justify-center px-4 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-150"
                              aria-label={`Approve report for ${entry.namaToko}`}
                          >
                              <Check size={14} className="mr-1.5" />
                              Approve
                          </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {selectedEntry && (
        <SttkDetailModal 
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  );
};
