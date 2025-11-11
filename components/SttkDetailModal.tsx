
import React from 'react';
import { Card } from './ui/Card';
import { SttkEntry } from '../hooks/useMockData';
import { X, FileText, Camera, Users, TrendingDown, TrendingUp, Link as LinkIcon } from 'lucide-react';

interface SttkDetailModalProps {
  entry: SttkEntry;
  onClose: () => void;
}

const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const DetailSection: React.FC<{ title: string; icon: React.ElementType; children: React.ReactNode }> = ({ title, icon: Icon, children }) => (
    <div>
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2">
            <Icon size={20} className="text-blue-600" />
            {title}
        </h3>
        {children}
    </div>
);

const InfoPair: React.FC<{ label: string; value: string | number | undefined; isCurrency?: boolean; className?: string }> = ({ label, value, isCurrency = false, className = '' }) => (
    <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`font-semibold text-gray-800 ${className}`}>
            {isCurrency ? formatCurrency(value as number) : (value ?? 'N/A')}
        </p>
    </div>
);

const FileLink: React.FC<{ url: string; label: string }> = ({ url, label }) => {
    if (!url || url === 'N/A') {
        return <span className="font-medium text-gray-500">Tidak dilampirkan</span>;
    }
    return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-blue-600 hover:underline">
            <LinkIcon size={14}/>
            {label}
        </a>
    );
};

export const SttkDetailModal: React.FC<SttkDetailModalProps> = ({ entry, onClose }) => {
    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
        >
            <Card 
                className="w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-fade-in-up"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors p-1 rounded-full hover:bg-gray-100"
                    aria-label="Close modal"
                >
                    <X size={24} />
                </button>
                
                <div className="pr-8">
                    <h2 className="text-2xl font-bold text-gray-900">{entry.namaToko}</h2>
                    <p className="text-gray-500 mb-6">Laporan STTK - {entry.tanggalSttk}</p>
                </div>
                
                <div className="space-y-8">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg">
                        <InfoPair label="Nama AM" value={entry.namaAM} />
                        <InfoPair label="Area" value={entry.area} />
                        <InfoPair label="Status" value={entry.status} className={entry.status === 'Verified' ? 'text-green-600' : 'text-yellow-600'}/>
                        <InfoPair label="Total Denda" value={entry.totalDenda} isCurrency className="text-red-600 text-lg" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Loss Details */}
                        <DetailSection title="Perhitungan Loss" icon={TrendingDown}>
                            <div className="space-y-3">
                                <InfoPair label="Selisih (+)" value={entry.lossDetails?.selisihPlus} isCurrency />
                                <InfoPair label="Selisih (-)" value={entry.lossDetails?.selisihMinus} isCurrency />
                                <InfoPair label="ED Awal (-)" value={entry.lossDetails?.edAwal} isCurrency />
                                <InfoPair label="ED Akhir (70%)" value={entry.lossDetails?.edAkhir} isCurrency />
                                <div className="pt-3 mt-3 border-t">
                                    <InfoPair label="Denda Loss" value={entry.lossDetails?.dendaAkhir} isCurrency className="text-xl font-bold" />
                                </div>
                            </div>
                        </DetailSection>

                        {/* Variance Details */}
                        <DetailSection title="Perhitungan Variance" icon={TrendingUp}>
                            <div className="space-y-3">
                                <InfoPair label="Nilai (+)" value={entry.varianceDetails?.nilaiPlus} isCurrency />
                                <InfoPair label="Nilai (-)" value={entry.varianceDetails?.nilaiMinus} isCurrency />
                                <InfoPair label="ED Awal" value={entry.varianceDetails?.edAwal} isCurrency />
                                <InfoPair label="Total" value={entry.varianceDetails?.total} isCurrency />
                                <InfoPair label="Kategori" value={entry.varianceDetails?.kategori} />
                                <div className="pt-3 mt-3 border-t">
                                    <InfoPair label="Denda Akurasi" value={entry.varianceDetails?.denda} isCurrency className="text-xl font-bold" />
                                </div>
                            </div>
                        </DetailSection>
                    </div>

                    {/* Penalty Distribution */}
                    {entry.penaltyDistribution && entry.penaltyDistribution.length > 0 && (
                        <DetailSection title="Distribusi Denda Karyawan" icon={Users}>
                             <div className="overflow-x-auto">
                                <table className="min-w-full text-sm divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Nama</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Jabatan</th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-500">Masa Kerja</th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-500">Jumlah Denda</th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {entry.penaltyDistribution.map((item, index) => (
                                        <tr key={index}>
                                        <td className="px-4 py-2 font-medium">{item.nama}</td>
                                        <td className="px-4 py-2 text-gray-600">{item.jabatan}</td>
                                        <td className="px-4 py-2 text-gray-600">{item.masaKerja}</td>
                                        <td className="px-4 py-2 text-right font-semibold text-red-600">{formatCurrency(item.jumlahDenda)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </DetailSection>
                    )}

                    {/* Files */}
                    <DetailSection title="Dokumen Terlampir" icon={FileText}>
                        <ul className="space-y-3">
                           <li className="flex items-center gap-2 text-gray-700"><FileText size={16} /> BAP STTK: <FileLink url={entry.files?.bap} label="Lihat File" /></li>
                           <li className="flex items-center gap-2 text-gray-700"><FileText size={16} /> List Barang Expired: <FileLink url={entry.files?.expiredList} label="Lihat File" /></li>
                           <li className="flex items-start gap-2 text-gray-700"><Camera size={16} className="mt-1" /> Foto Bukti Expired:
                                <div className="flex flex-wrap gap-2">
                                    {entry.files?.photos && entry.files.photos.length > 0 ? entry.files.photos.map((photoUrl, i) => (
                                        <FileLink key={i} url={photoUrl} label={`Foto #${i + 1}`} />
                                    )) : (
                                        <span className="font-medium text-gray-500">Tidak dilampirkan</span>
                                    )}
                                </div>
                           </li>
                        </ul>
                    </DetailSection>

                </div>
            </Card>
        </div>
    )
};

// Add some simple animations to index.html
const style = document.createElement('style');
style.textContent = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out forwards;
  }
`;
document.head.append(style);
