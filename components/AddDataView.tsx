import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { FileUpload } from './ui/FileUpload';
import { Select } from './ui/Select';
import { addSttkReport, getDropdownOptions } from '../services/apiService';
import { Loader2, CheckCircle, AlertTriangle, Plus, Trash2, X, Users, File as FileIcon } from 'lucide-react';
import { Employee } from '../types';

interface FormDataState {
  namaAM: string;
  nipAM: string;
  area: string;
  namaToko: string;
  tanggalSttk: string;
  masaKerjaAM: string;
}

interface AddDataViewProps {
  onReportSubmitted: () => void;
}

// Definisikan tipe untuk file yang sudah di-encode Base64
interface FileData {
    name: string;
    mimeType: string;
    base64: string;
}

const initialFormData: FormDataState = {
  namaAM: '',
  nipAM: '',
  area: '',
  namaToko: '',
  tanggalSttk: '',
  masaKerjaAM: '',
};

const initialLossData = { selisihPlus: '', selisihMinus: '', edAwal: '' };
const initialVarianceData = { nilaiPlus: '', nilaiMinus: '', edAwal: '' };
const initialEmployeeState: Employee = { id: `emp-${Date.now()}`, nama: '', nip: '', jabatan: '', masaKerja: '' };

const areaOptions = [ 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Pusat', 'Jakarta Selatan', 'Tangerang', 'Tangerang Selatan', 'Bekasi', 'Bogor', 'Depok', 'Bandung' ];
const jabatanOptions = [ 'Area Manager', 'Branch Manager (BM)', 'Apoteker', 'Health Advisor (HA)', 'Asistent Apoteker (AA)' ];
const masaKerjaOptions = ['> 3 bulan', '< 3 bulan'];

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
const parseFormattedNumber = (str: string): number => {
    if (!str) return 0;
    const sanitized = str.toString().replace(/[^0-9-]/g, '');
    return parseInt(sanitized, 10) || 0;
}

interface PenaltyDistributionItem {
  nama: string;
  jabatan: string;
  jumlahDenda: number;
  masaKerja: string;
  nip: string;
}

// Helper untuk mengubah File menjadi Base64
const fileToBase64 = (file: File): Promise<FileData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Server mengharapkan hanya konten base64, bukan seluruh data URI.
            // Kita pisahkan di sini karena tipe mime sudah dikirim secara terpisah.
            const base64Content = result.split(',')[1];
            if (!base64Content) {
                reject(new Error(`Gagal mengonversi file: ${file.name}. Format data URL tidak valid.`));
                return;
            }
            resolve({
                name: file.name,
                mimeType: file.type,
                base64: base64Content,
            });
        };
        reader.onerror = () => reject(new Error(`Gagal membaca file: ${file.name}`));
    });
};

const FileList: React.FC<{
    files: File[];
    onRemove: (index: number) => void;
}> = ({ files, onRemove }) => {
    if (files.length === 0) return null;
    return (
        <div className="mt-2 space-y-2">
            {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between gap-2 p-2 bg-slate-100 rounded-md text-sm border">
                    <div className="flex items-center gap-2 truncate">
                       <FileIcon size={16} className="text-gray-500 flex-shrink-0" />
                       <span className="truncate" title={file.name}>{file.name}</span>
                    </div>
                    <button type="button" onClick={() => onRemove(index)} className="text-red-500 hover:text-red-700 flex-shrink-0 p-1 hover:bg-red-50 rounded-full">
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};


export const AddDataView: React.FC<AddDataViewProps> = ({ onReportSubmitted }) => {
  const [formData, setFormData] = useState<FormDataState>(initialFormData);
  const [employees, setEmployees] = useState<Employee[]>([initialEmployeeState]);
  const [files, setFiles] = useState<{ bap: File[], expiredList: File[], photos: File[] }>({
    bap: [], expiredList: [], photos: []
  });
  const [lossData, setLossData] = useState(initialLossData);
  const [varianceData, setVarianceData] = useState(initialVarianceData);
  
  const [calculatedLoss, setCalculatedLoss] = useState({ edAkhir: 0, dendaAkhir: 0 });
  const [calculatedVariance, setCalculatedVariance] = useState({ total: 0, kategori: 'N/A', denda: 0 });
  const [totalDendaSttk, setTotalDendaSttk] = useState(0);
  const [penaltyDistribution, setPenaltyDistribution] = useState<PenaltyDistributionItem[]>([]);

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [formKey, setFormKey] = useState(Date.now());

  // State untuk dropdown options
  const [amOptions, setAmOptions] = useState<{ name: string; nip: string }[]>([]);
  const [tokoOptions, setTokoOptions] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      setOptionsError(null);
      try {
        const data = await getDropdownOptions();
        setAmOptions(data.amOptions);
        setTokoOptions(data.tokoOptions);
      } catch (error) {
        console.error("Failed to fetch dropdown options:", error);
        setOptionsError("Gagal memuat data pilihan dari server. Silakan coba muat ulang halaman.");
      } finally {
        setIsLoadingOptions(false);
      }
    };
    fetchOptions();
  }, []);
  
  useEffect(() => {
    const dendaLoss = Math.abs(calculatedLoss.dendaAkhir);
    setTotalDendaSttk(dendaLoss + calculatedVariance.denda);
  }, [calculatedLoss.dendaAkhir, calculatedVariance.denda]);

   useEffect(() => {
    const selisihPlus = parseFormattedNumber(lossData.selisihPlus);
    const selisihMinus = parseFormattedNumber(lossData.selisihMinus);
    const edAwal = parseFormattedNumber(lossData.edAwal);
    setCalculatedLoss({
        edAkhir: edAwal * 0.7,
        dendaAkhir: selisihPlus + selisihMinus + (edAwal * 0.7),
    });
  }, [lossData]);

  useEffect(() => {
    const nilaiPlus = parseFormattedNumber(varianceData.nilaiPlus);
    const nilaiMinus = parseFormattedNumber(varianceData.nilaiMinus);
    const edAwal = parseFormattedNumber(varianceData.edAwal);
    const totalCalc = nilaiPlus - Math.abs(nilaiMinus) + edAwal;
    let kategori = 'A', denda = 0;
    if (totalCalc > 10000000) {
      kategori = 'C'; denda = 1000000;
    } else if (totalCalc >= 5000000) {
      kategori = 'B'; denda = 500000;
    }
    setCalculatedVariance({ total: totalCalc, kategori, denda });
  }, [varianceData]);

  useEffect(() => {
    if (totalDendaSttk <= 0) {
      setPenaltyDistribution([]); return;
    }
    const dist: PenaltyDistributionItem[] = [];
    const namedEmployees = employees.filter(e => e.nama && e.jabatan && e.masaKerja);
    const hasBM = namedEmployees.some(e => e.jabatan === 'Branch Manager (BM)');
    const amBasePercent = hasBM ? 7.5 : 10, bmBasePercent = hasBM ? 37.5 : 0, teamPoolPercent = hasBM ? 55 : 90;

    if (formData.namaAM) {
        dist.push({ nama: formData.namaAM, jabatan: 'Area Manager', masaKerja: formData.masaKerjaAM, jumlahDenda: totalDendaSttk * (amBasePercent / 100), nip: 'N/A' });
    }
    const bmEmployee = namedEmployees.find(e => e.jabatan === 'Branch Manager (BM)');
    if (hasBM && bmEmployee) {
        dist.push({ ...bmEmployee, jumlahDenda: totalDendaSttk * (bmBasePercent / 100) });
    }
    const storeTeam = namedEmployees.filter(e => e.jabatan !== 'Branch Manager (BM)');
    if (storeTeam.length > 0) {
        const teamWithShares = storeTeam.map(e => ({ ...e, shares: e.masaKerja.includes('< 3') ? (4/9) : 1 }));
        const totalShares = teamWithShares.reduce((sum, e) => sum + e.shares, 0);
        if (totalShares > 0) {
            const teamPoolAmount = totalDendaSttk * (teamPoolPercent / 100);
            teamWithShares.forEach(e => {
                dist.push({ ...e, jumlahDenda: teamPoolAmount * (e.shares / totalShares) });
            });
        }
    }
    dist.sort((a,b) => {
        const order = {'Area Manager': 1, 'Branch Manager (BM)': 2};
        return (order[a.jabatan] || 3) - (order[b.jabatan] || 3);
    });
    setPenaltyDistribution(dist);
  }, [totalDendaSttk, employees, formData.namaAM, formData.masaKerjaAM]);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleLossInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setLossData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleVarianceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setVarianceData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleEmployeeChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEmployees(emps => emps.map(emp => emp.id === id ? { ...emp, [e.target.name]: e.target.value } : emp));
  const addEmployee = () => setEmployees(e => [...e, { ...initialEmployeeState, id: `emp-${Date.now()}` }]);
  const removeEmployee = (id: string) => { if (employees.length > 1) setEmployees(e => e.filter(emp => emp.id !== id)); };
  
  const handleAddFiles = (newFiles: File[], type: 'bap' | 'expiredList' | 'photos') => {
    setFiles(f => ({ ...f, [type]: [...f[type], ...newFiles] }));
  };
  
  const handleFileRemove = (index: number, type: 'bap' | 'expiredList' | 'photos') => {
    setFiles(f => ({ ...f, [type]: f[type].filter((_, i) => i !== index) }));
  };

  const resetForm = () => {
      setFormData(initialFormData);
      setEmployees([initialEmployeeState]);
      setFiles({ bap: [], expiredList: [], photos: [] });
      setLossData(initialLossData);
      setVarianceData(initialVarianceData);
      setFormKey(Date.now());
      setStatus('idle');
      setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validasi file yang wajib diisi
    if (files.bap.length === 0 || files.expiredList.length === 0 || files.photos.length === 0) {
        setStatus('error');
        setMessage('Harap unggah semua file yang wajib diisi (BAP, List Barang, dan Foto).');
        return;
    }
    
    setStatus('loading');
    setMessage('Mempersiapkan data file...');

    try {
        // Mengonversi file menjadi Base64
        // BAP & List Expired: Kirim hanya file pertama, sesuai struktur yang diharapkan server.
        const bapData = await fileToBase64(files.bap[0]); 
        const expiredListData = await fileToBase64(files.expiredList[0]);
        
        // Photos: Kirim semua file, karena ini diharapkan sebagai array.
        const photosData = await Promise.all(files.photos.map(f => fileToBase64(f)));
        
        setMessage('Mengirim laporan ke server...');

        const reportData = {
            ...formData,
            lossDetails: {
              selisihPlus: parseFormattedNumber(lossData.selisihPlus),
              selisihMinus: parseFormattedNumber(lossData.selisihMinus),
              edAwal: parseFormattedNumber(lossData.edAwal),
              dendaAkhir: calculatedLoss.dendaAkhir,
            },
            varianceDetails: {
              nilaiPlus: parseFormattedNumber(varianceData.nilaiPlus),
              nilaiMinus: parseFormattedNumber(varianceData.nilaiMinus),
              edAwal: parseFormattedNumber(varianceData.edAwal),
              kategori: calculatedVariance.kategori,
              denda: calculatedVariance.denda,
            },
            totalDenda: totalDendaSttk,
            penaltyDistribution: penaltyDistribution,
            files: {
                bap: bapData, // Kirim sebagai objek tunggal
                expiredList: expiredListData, // Kirim sebagai objek tunggal
                photos: photosData // Kirim sebagai array objek
            }
        };
        
        const result = await addSttkReport(reportData);
        
        if (result.success) {
          setStatus('success');
          setMessage(result.message);
          onReportSubmitted();
          resetForm();
        } else {
          setStatus('error');
          setMessage(result.message);
        }
    } catch (error) {
        setStatus('error');
        if (error instanceof Error) {
            setMessage(error.message);
        } else {
            console.error("An unexpected error occurred during submission:", error);
            setMessage('Terjadi kesalahan yang tidak terduga saat memproses file.');
        }
    }
  };

  return (
    <Card>
      <form key={formKey} onSubmit={handleSubmit} className="space-y-10">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informasi STTK</h3>
          {optionsError && (
              <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 rounded-md border border-red-200">
                  <p className="font-bold">Gagal memuat data</p>
                  <p>{optionsError}</p>
              </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select 
              label="Nama AM"
              name="namaAM"
              value={formData.namaAM}
              onChange={handleInputChange}
              options={amOptions.map(am => am.name)}
              required
              disabled={isLoadingOptions || !!optionsError}
              placeholder={isLoadingOptions ? "Memuat..." : "Pilih AM"}
            />
            <Input label="NIP AM" name="nipAM" value={formData.nipAM} onChange={handleInputChange} required />
            <Select label="Area" name="area" value={formData.area} onChange={handleInputChange} options={areaOptions} required />
            <Select label="Masa Kerja AM" name="masaKerjaAM" value={formData.masaKerjaAM} onChange={handleInputChange} options={masaKerjaOptions} required />
            <div className="md:col-span-2">
                <Select
                  label="Nama Toko"
                  name="namaToko"
                  value={formData.namaToko}
                  onChange={handleInputChange}
                  options={tokoOptions}
                  required
                  disabled={isLoadingOptions || !!optionsError}
                  placeholder={isLoadingOptions ? "Memuat..." : "Pilih Toko"}
                />
            </div>
            <div className="md:col-span-2">
                <Input label="Tanggal STTK" name="tanggalSttk" type="date" value={formData.tanggalSttk} onChange={handleInputChange} required />
            </div>
          </div>
        </div>
        
        <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">(1) Perhitungan Kehilangan / Loss</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Selisih (+)" name="selisihPlus" value={lossData.selisihPlus} onChange={handleLossInputChange} placeholder="Contoh: 5000000" />
                <Input label="Selisih (–)" name="selisihMinus" value={lossData.selisihMinus} onChange={handleLossInputChange} placeholder="Contoh: -1000000" />
                <Input label="ED Awal (–)" name="edAwal" value={lossData.edAwal} onChange={handleLossInputChange} placeholder="Contoh: -10000000" />
                <InfoDisplay label="ED Akhir (70%)" value={formatCurrency(calculatedLoss.edAkhir)} />
            </div>
            <div className="mt-6 pt-4 border-t border-dashed">
                <InfoDisplay label="Denda Loss" value={formatCurrency(Math.abs(calculatedLoss.dendaAkhir))} isLarge />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">(2) Perhitungan Variance / Akurasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label="Nilai (+)" name="nilaiPlus" value={varianceData.nilaiPlus} onChange={handleVarianceInputChange} placeholder="Contoh: 5000000" />
                <Input label="Nilai (–)" name="nilaiMinus" value={varianceData.nilaiMinus} onChange={handleVarianceInputChange} placeholder="Contoh: -1000000" />
                <Input label="ED Awal" name="edAwal" value={varianceData.edAwal} onChange={handleVarianceInputChange} placeholder="Contoh: 10000000" />
            </div>
             <div className="mt-6 pt-4 border-t border-dashed grid grid-cols-1 md:grid-cols-3 gap-6">
                <InfoDisplay label="Total" value={formatCurrency(calculatedVariance.total)} />
                <InfoDisplay label="Kategori" value={calculatedVariance.kategori} isCentered />
                <InfoDisplay label="Denda Akurasi" value={formatCurrency(calculatedVariance.denda)} />
            </div>
        </div>

        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-bold text-red-800">Total Denda STTK (Loss + Akurasi)</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">{formatCurrency(totalDendaSttk)}</p>
        </div>

        {penaltyDistribution.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4 flex items-center gap-2"><Users size={20}/> Distribusi Denda Karyawan</h3>
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
                  {penaltyDistribution.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 font-bold">{item.nama}</td>
                      <td className="px-4 py-2 text-gray-600">{item.jabatan}</td>
                      <td className="px-4 py-2 text-gray-600">{item.masaKerja}</td>
                      <td className="px-4 py-2 text-right font-semibold text-red-600">{formatCurrency(item.jumlahDenda)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Daftar Karyawan Toko</h3>
          {employees.map((employee, index) => (
            <Card key={employee.id} className="mb-4 relative bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input label={`Nama Karyawan #${index + 1}`} name="nama" value={employee.nama} onChange={(e) => handleEmployeeChange(employee.id, e)} />
                <Input label="NIP" name="nip" value={employee.nip} onChange={(e) => handleEmployeeChange(employee.id, e)} />
                <Select label="Jabatan" name="jabatan" value={employee.jabatan} onChange={(e) => handleEmployeeChange(employee.id, e)} options={jabatanOptions} />
                <Select label="Masa Kerja" name="masaKerja" value={employee.masaKerja} onChange={(e) => handleEmployeeChange(employee.id, e)} options={masaKerjaOptions} />
              </div>
              {employees.length > 1 && (
                  <button type="button" onClick={() => removeEmployee(employee.id)} className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-100 rounded-full">
                      <Trash2 size={16} />
                  </button>
              )}
            </Card>
          ))}
          <Button type="button" onClick={addEmployee} className="bg-gray-700 hover:bg-gray-800">
            <Plus size={16} className="mr-2" /> Tambah Karyawan
          </Button>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Upload Bukti STTK</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <FileUpload label="BAP STTK" onFileSelect={(newFiles) => handleAddFiles(newFiles, 'bap')} multiple required />
                    <FileList files={files.bap} onRemove={(index) => handleFileRemove(index, 'bap')} />
                </div>
                <div>
                    <FileUpload label="List Barang Expired (upload dalam excel dan pdf)" onFileSelect={(newFiles) => handleAddFiles(newFiles, 'expiredList')} multiple required />
                    <FileList files={files.expiredList} onRemove={(index) => handleFileRemove(index, 'expiredList')} />
                </div>
                <div>
                    <FileUpload label="Bukti Foto Barang Expired" onFileSelect={(newFiles) => handleAddFiles(newFiles, 'photos')} multiple required />
                    <FileList files={files.photos} onRemove={(index) => handleFileRemove(index, 'photos')} />
                </div>
            </div>
        </div>
        
        <div className="pt-6 border-t">
          {status === 'loading' && <StatusMessage type="loading" message={message} />}
          {status === 'success' && <StatusMessage type="success" message={message} />}
          {status === 'error' && <StatusMessage type="error" message={message} />}
          <Button type="submit" disabled={status === 'loading'} className="w-full mt-4">{status === 'loading' ? 'Mengirim...' : 'Kirim Laporan'}</Button>
        </div>
      </form>
    </Card>
  );
};

const InfoDisplay: React.FC<{label: string, value: string, isLarge?: boolean, isCentered?: boolean}> = ({ label, value, isLarge, isCentered }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        <div className={`mt-1 p-2 w-full bg-gray-100 border rounded-md ${isLarge ? 'text-xl font-bold' : 'font-semibold'} ${isCentered ? 'text-center' : ''}`}>
            {value}
        </div>
    </div>
);

const StatusMessage: React.FC<{type: 'loading' | 'success' | 'error', message: string}> = ({ type, message }) => {
    const baseClasses = "flex justify-center items-center gap-2 p-3 rounded-md";
    const styles = {
        loading: { class: "bg-blue-50 text-blue-700", icon: <Loader2 className="animate-spin" /> },
        success: { class: "bg-green-50 text-green-700", icon: <CheckCircle /> },
        error: { class: "bg-red-50 text-red-700", icon: <AlertTriangle /> },
    };
    return (
        <div className={`${baseClasses} ${styles[type].class}`}>
            {styles[type].icon}
            <span>{message}</span>
        </div>
    );
};