import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Button } from './ui/Button';
import { FileUpload } from './ui/FileUpload';
import { Select } from './ui/Select';
import { addSttkReport, getDropdownOptions } from '../services/apiService';
import { Loader2, CheckCircle, AlertTriangle, Plus, Trash2, X, Users, File as FileIcon } from 'lucide-react';
import { Employee } from '../types';
import { ALL_AM_OPTIONS } from './KpiView';

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
const initialOldAmData = { namaAM: '', nipAM: '', masaKerjaAM: '' };


const areaOptions = [ 'Jakarta Utara', 'Jakarta Barat', 'Jakarta Timur', 'Jakarta Pusat', 'Jakarta Selatan', 'Tangerang', 'Tangerang Selatan', 'Bekasi', 'Bogor', 'Depok', 'Bandung' ];
const jabatanOptions = [ 'Branch Manager (BM)', 'Apoteker', 'Health Advisor (HA)', 'Tenaga Kefarmasian (TTK)' ];
const masaKerjaOptions = ['> 3 bulan', '< 3 bulan'];

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

// Helper untuk memparsing angka dari string terformat (misal: "-1.000.000" -> -1000000)
const parseFormattedNumber = (str: string): number => {
    if (!str) return 0;
    // Hapus semua karakter kecuali angka dan tanda minus
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
        if (!file) {
            return reject(new Error("File object tidak valid."));
        }

        const reader = new FileReader();

        reader.onload = () => {
            try {
                const result = reader.result;

                if (typeof result !== 'string') {
                    throw new Error(`Hasil pembacaan file '${file.name}' bukan string.`);
                }

                const base64Content = result;

                resolve({
                    name: file.name,
                    mimeType: file.type || 'application/octet-stream',
                    base64: base64Content,
                });

            } catch (e) {
                reject(e instanceof Error ? e : new Error(`Error tidak diketahui saat memproses file '${file.name}'`));
            }
        };

        reader.onerror = () => {
            reject(new Error(`Gagal membaca file '${file.name}'. Error: ${reader.error?.message || 'Tidak diketahui'}`));
        };
        
        reader.readAsDataURL(file);
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

const InfoDisplay: React.FC<{ label: string; value: string; isLarge?: boolean; isCentered?: boolean }> = ({ label, value, isLarge = false, isCentered = false }) => (
    <div className={`p-3 bg-slate-100 rounded-md ${isCentered ? 'text-center' : ''}`}>
        <p className="text-sm text-gray-500">{label}</p>
        <p className={`font-bold ${isLarge ? 'text-2xl text-red-600' : 'text-lg text-gray-800'}`}>{value}</p>
    </div>
);

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

  const [isAmChanged, setIsAmChanged] = useState(false);
  const [oldAmData, setOldAmData] = useState(initialOldAmData);

  const [tokoOptions, setTokoOptions] = useState<string[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOptions = async () => {
      setIsLoadingOptions(true);
      setOptionsError(null);
      try {
        const data = await getDropdownOptions();
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
    
    // Rumus Loss: Selisih (+) - Selisih (-) - ED Akhir (70%)
    // Nilai selisihMinus dan edAwal sudah negatif dari input karena forceNegative=true
    // Jadi kita menjumlahkan nilainya (karena nilai di variabel sudah minus)
    
    const edAkhir = edAwal * 0.7;
    // Perhitungan saldo akhir: Plus + Minus + ED Akhir (yang negatif)
    const saldoAkhir = selisihPlus + selisihMinus + edAkhir;

    setCalculatedLoss({
        edAkhir: edAkhir,
        dendaAkhir: saldoAkhir >= 0 ? 0 : saldoAkhir, // Jika positif/0 maka 0, jika negatif maka denda
    });
  }, [lossData]);

  useEffect(() => {
    const nilaiPlus = parseFormattedNumber(varianceData.nilaiPlus);
    const nilaiMinus = parseFormattedNumber(varianceData.nilaiMinus);
    const edAwal = parseFormattedNumber(varianceData.edAwal);
    
    // Rumus Variance / Akurasi (Nilai Mutlak/Absolut)
    // Total = |Nilai Plus| + |Nilai Minus| + |ED Awal|
    const totalCalc = Math.abs(nilaiPlus) + Math.abs(nilaiMinus) + Math.abs(edAwal);
    
    let kategori = 'A', denda = 0;
    if (totalCalc > 10000000) {
      kategori = 'C'; denda = 1000000;
    } else if (totalCalc >= 5000000) {
      kategori = 'B'; denda = 500000;
    }
    setCalculatedVariance({ total: totalCalc, kategori, denda });
  }, [varianceData]);

  // --- LOGIKA UTAMA PERHITUNGAN DENDA (SILOED GROUPS) ---
  useEffect(() => {
    if (totalDendaSttk <= 0) {
      setPenaltyDistribution([]);
      return;
    }

    interface GroupMember {
        id: string;
        nama: string;
        jabatan: string;
        masaKerja: string;
        nip: string;
    }

    // 1. KUMPULKAN DATA KARYAWAN
    const namedEmployees = employees.filter(e => e.nama && e.jabatan && e.masaKerja);
    
    // Group BM
    const bmList: GroupMember[] = namedEmployees
        .filter(e => e.jabatan === 'Branch Manager (BM)')
        .map(e => ({ ...e, id: e.id }));
    
    // Group Store Team (Semua selain BM)
    const storeTeamList: GroupMember[] = namedEmployees
        .filter(e => e.jabatan !== 'Branch Manager (BM)')
        .map(e => ({ ...e, id: e.id }));

    // Group AM
    const amList: GroupMember[] = [];
    // AM Baru
    if (formData.namaAM) {
        amList.push({
            id: 'am-new',
            nama: formData.namaAM,
            nip: formData.nipAM,
            masaKerja: formData.masaKerjaAM,
            jabatan: isAmChanged ? 'Area Manager (Baru)' : 'Area Manager'
        });
    }
    // AM Lama
    if (isAmChanged && oldAmData.namaAM) {
        amList.push({
            id: 'am-old',
            nama: oldAmData.namaAM,
            nip: oldAmData.nipAM,
            masaKerja: oldAmData.masaKerjaAM,
            jabatan: 'Area Manager (Lama)'
        });
    }

    const hasBM = bmList.length > 0;

    // 2. TENTUKAN ALOKASI PERSEN PER GROUP
    let amAlloc = 0, bmAlloc = 0, teamAlloc = 0;

    if (hasBM) {
        amAlloc = 0.05; // 5%
        bmAlloc = 0.35; // 35%
        teamAlloc = 0.60; // 60%
    } else {
        amAlloc = 0.10; // 10%
        bmAlloc = 0;
        teamAlloc = 0.90; // 90%
    }

    // 3. FUNGSI DISTRIBUSI INTERNAL GROUP
    // Logika: Total Denda Group dibagi rata. 
    // Junior (< 3 bulan / AM Lama) bayar 50%.
    // Defisit ditanggung oleh Senior (> 3 bulan & Bukan AM Lama) di group yang sama.
    // Jika TIDAK ADA Senior di group, Junior bayar FULL (diskon batal).
    const distributeToGroup = (members: GroupMember[], groupTotalDenda: number): PenaltyDistributionItem[] => {
        if (members.length === 0) return [];

        const baseShare = groupTotalDenda / members.length;
        
        // Cari siapa saja senior yang berhak menanggung beban (Redistribution receivers)
        // AM Lama TIDAK PERNAH dianggap senior (tidak menanggung beban)
        const seniors = members.filter(m => 
            m.masaKerja === '> 3 bulan' && m.jabatan !== 'Area Manager (Lama)'
        );

        // Diskon Junior hanya aktif jika ada Senior yang bisa menanggung (atau sesuai kebijakan user)
        // Berdasarkan contoh user: AM < 3 bulan (tanpa senior) bayar 100k (full). 
        // Tim Toko Junior (ada senior) bayar 50%.
        const canRedistribute = seniors.length > 0;

        let groupDeficit = 0;
        
        // Tahap 1: Hitung kontribusi awal (dengan potensi diskon)
        const preliminaryResults = members.map(m => {
            const isAmLama = m.jabatan === 'Area Manager (Lama)';
            const isJunior = m.masaKerja === '< 3 bulan' || isAmLama;
            
            let finalShare = baseShare;
            
            if (isJunior && canRedistribute) {
                finalShare = baseShare * 0.5; // Bayar 50%
                groupDeficit += (baseShare - finalShare); // Sisa 50% masuk defisit
            }
            
            return {
                ...m,
                jumlahDenda: finalShare,
                isReceiver: !isAmLama && m.masaKerja === '> 3 bulan' // Penanda penerima redistribusi
            };
        });

        // Tahap 2: Redistribusi defisit ke Senior
        if (groupDeficit > 0 && canRedistribute) {
            const deficitPerSenior = groupDeficit / seniors.length;
            preliminaryResults.forEach(m => {
                if (m.isReceiver) {
                    m.jumlahDenda += deficitPerSenior;
                }
            });
        }

        return preliminaryResults.map(r => ({
            nama: r.nama,
            jabatan: r.jabatan,
            masaKerja: r.masaKerja,
            nip: r.nip,
            jumlahDenda: r.jumlahDenda
        }));
    };

    // 4. JALANKAN DISTRIBUSI
    const amResults = distributeToGroup(amList, totalDendaSttk * amAlloc);
    const bmResults = distributeToGroup(bmList, totalDendaSttk * bmAlloc);
    const teamResults = distributeToGroup(storeTeamList, totalDendaSttk * teamAlloc);

    // 5. GABUNGKAN HASIL
    const finalDist = [...amResults, ...bmResults, ...teamResults];

    // Sort agar urutan rapi: AM -> BM -> Lainnya
    finalDist.sort((a,b) => {
        const order: Record<string, number> = {
            'Area Manager (Baru)': 1, 
            'Area Manager (Lama)': 2, 
            'Area Manager': 1, 
            'Branch Manager (BM)': 3
        };
        // Default priority 4 for staff
        const rankA = order[a.jabatan] || 4;
        const rankB = order[b.jabatan] || 4;
        return rankA - rankB;
    });

    setPenaltyDistribution(finalDist);

  }, [totalDendaSttk, employees, formData, isAmChanged, oldAmData]);
  

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleOldAmChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setOldAmData(p => ({ ...p, [e.target.name]: e.target.value }));
  
  // --- FUNGSI INPUT BARU UNTUK MATA UANG OTOMATIS ---
  const handleCurrencyInput = (
    e: React.ChangeEvent<HTMLInputElement>, 
    setter: React.Dispatch<React.SetStateAction<any>>, 
    forceNegative: boolean = false
  ) => {
      const rawValue = e.target.value.replace(/[^0-9]/g, ''); // Hanya ambil angka
      
      if (!rawValue) {
          setter((prev: any) => ({ ...prev, [e.target.name]: '' }));
          return;
      }

      const numberVal = parseInt(rawValue, 10);
      let formatted = new Intl.NumberFormat('id-ID').format(numberVal);
      
      // Jika field ini wajib negatif (misal Selisih Minus), tambahkan '-' di depan otomatis
      if (forceNegative) {
          formatted = '-' + formatted;
      }

      setter((prev: any) => ({ ...prev, [e.target.name]: formatted }));
  };

  const handleEmployeeChange = (id: string, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEmployees(emps => emps.map(emp => emp.id === id ? { ...emp, [e.target.name]: e.target.value } : emp));
  const addEmployee = () => setEmployees(e => [...e, { ...initialEmployeeState, id: `emp-${Date.now()}` }]);
  const removeEmployee = (id: string) => { if (employees.length > 1) setEmployees(e => e.filter(emp => emp.id !== id)); };
  
  const handleAddFiles = (newFiles: File[], type: 'bap' | 'expiredList' | 'photos') => {
    if (type === 'bap' || type === 'expiredList') {
        setFiles(f => ({ ...f, [type]: newFiles.slice(0, 1) }));
    } else {
        setFiles(f => ({ ...f, [type]: [...f[type], ...newFiles] }));
    }
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
      setIsAmChanged(false);
      setOldAmData(initialOldAmData);
      setFormKey(Date.now());
      setStatus('idle');
      setMessage('');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (files.bap.length === 0 || files.expiredList.length === 0 || files.photos.length === 0) {
        setStatus('error');
        setMessage('Harap unggah semua file yang wajib diisi (BAP, List Barang, dan Foto).');
        return;
    }
    
    setStatus('loading');
    setMessage('Mempersiapkan data file...');

    try {
        const bapData = files.bap.length > 0 ? await fileToBase64(files.bap[0]) : null;
        const expiredListData = files.expiredList.length > 0 ? await fileToBase64(files.expiredList[0]) : null;
        const photosData = await Promise.all(files.photos.map(f => fileToBase64(f)));
        
        setMessage('Mengirim laporan ke server...');

        const reportData = {
            ...formData,
            isAmChanged,
            oldAmData: isAmChanged ? oldAmData : {},
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
                bap: bapData,
                expiredList: expiredListData,
                photos: photosData
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
            setMessage(`Terjadi kesalahan di server: ${error.message}`);
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
              label="Nama AM (Baru)"
              name="namaAM"
              value={formData.namaAM}
              onChange={handleInputChange}
              options={ALL_AM_OPTIONS}
              required
              disabled={!!optionsError}
              placeholder="Pilih AM"
            />
            <Input label="NIP AM (Baru)" name="nipAM" value={formData.nipAM} onChange={handleInputChange} required />
            <Select label="Area" name="area" value={formData.area} onChange={handleInputChange} options={areaOptions} required />
            <Select label="Masa Kerja AM (Baru)" name="masaKerjaAM" value={formData.masaKerjaAM} onChange={handleInputChange} options={masaKerjaOptions} required />
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

          <div className="mt-6 flex items-center gap-3 bg-gray-50 p-3 rounded-md">
            <input
              id="amChangeCheckbox"
              type="checkbox"
              checked={isAmChanged}
              onChange={(e) => setIsAmChanged(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="amChangeCheckbox" className="text-sm font-medium text-gray-700">
              Ada pergantian AM dalam 3 bulan terakhir?
            </label>
          </div>

          {isAmChanged && (
            <Card className="bg-orange-50 border border-orange-200 animate-fade-in-up">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Informasi AM Lama</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Nama AM Lama"
                  name="namaAM"
                  value={oldAmData.namaAM}
                  onChange={handleOldAmChange}
                  options={ALL_AM_OPTIONS}
                  required={isAmChanged}
                  placeholder="Pilih AM Lama"
                />
                <Input label="NIP AM Lama" name="nipAM" value={oldAmData.nipAM} onChange={handleOldAmChange} required={isAmChanged} />
                <div className="md:col-span-2">
                   <Select label="Masa Kerja AM Lama" name="masaKerjaAM" value={oldAmData.masaKerjaAM} onChange={handleOldAmChange} options={masaKerjaOptions} required={isAmChanged} />
                </div>
              </div>
            </Card>
          )}
        </div>
        
        <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">(1) Perhitungan Kehilangan / Loss</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                    label="Selisih (+)" 
                    name="selisihPlus" 
                    value={lossData.selisihPlus} 
                    onChange={(e) => handleCurrencyInput(e, setLossData, false)} 
                    placeholder="Contoh: 5.000.000" 
                />
                <Input 
                    label="Selisih (–)" 
                    name="selisihMinus" 
                    value={lossData.selisihMinus} 
                    onChange={(e) => handleCurrencyInput(e, setLossData, true)} 
                    placeholder="Otomatis minus saat ketik, contoh: -1.000.000" 
                />
                <Input 
                    label="ED Awal (–)" 
                    name="edAwal" 
                    value={lossData.edAwal} 
                    onChange={(e) => handleCurrencyInput(e, setLossData, true)} 
                    placeholder="Otomatis minus saat ketik, contoh: -10.000.000" 
                />
                <InfoDisplay label="ED Akhir (70%)" value={formatCurrency(calculatedLoss.edAkhir)} />
            </div>
            <div className="mt-6 pt-4 border-t border-dashed">
                <InfoDisplay label="Denda Loss" value={formatCurrency(Math.abs(calculatedLoss.dendaAkhir))} isLarge />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">(2) Perhitungan Variance / Akurasi</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                    label="Nilai (+)" 
                    name="nilaiPlus" 
                    value={varianceData.nilaiPlus} 
                    onChange={(e) => handleCurrencyInput(e, setVarianceData, false)} 
                    placeholder="Contoh: 5.000.000" 
                />
                <Input 
                    label="Nilai (–)" 
                    name="nilaiMinus" 
                    value={varianceData.nilaiMinus} 
                    onChange={(e) => handleCurrencyInput(e, setVarianceData, true)} 
                    placeholder="Otomatis minus saat ketik, contoh: -1.000.000" 
                />
                <Input 
                    label="ED Awal" 
                    name="edAwal" 
                    value={varianceData.edAwal} 
                    onChange={(e) => handleCurrencyInput(e, setVarianceData, false)} 
                    placeholder="Contoh: 10.000.000" 
                />
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
                    <FileUpload label="BAP STTK" onFileSelect={(newFiles) => handleAddFiles(newFiles, 'bap')} required />
                    <FileList files={files.bap} onRemove={(index) => handleFileRemove(index, 'bap')} />
                </div>
                <div>
                    <label htmlFor="list-barang-expired-upload" className="block text-sm font-medium text-gray-700 mb-1">
                        List Barang Expired <span className="text-red-500">*</span>
                        <span className="ml-2 text-xs text-gray-500 font-normal">(upload dalam excel & PDF)</span>
                    </label>
                    <FileUpload id="list-barang-expired-upload" onFileSelect={(newFiles) => handleAddFiles(newFiles, 'expiredList')} />
                    <FileList files={files.expiredList} onRemove={(index) => handleFileRemove(index, 'expiredList')} />
                </div>
                <div>
                    <FileUpload label="Foto Bukti Expired" onFileSelect={(newFiles) => handleAddFiles(newFiles, 'photos')} multiple required />
                    <FileList files={files.photos} onRemove={(index) => handleFileRemove(index, 'photos')} />
                </div>
            </div>
        </div>

        <div className="pt-6 border-t">
          {status !== 'idle' && (
            <div className={`p-4 mb-4 rounded-md text-sm ${
              status === 'loading' ? 'bg-blue-50 text-blue-800' :
              status === 'success' ? 'bg-green-50 text-green-800' :
              'bg-red-50 text-red-800'
            }`}>
              <div className="flex items-center gap-2">
                {status === 'loading' && <Loader2 className="animate-spin" size={16} />}
                {status === 'success' && <CheckCircle size={16} />}
                {status === 'error' && <AlertTriangle size={16} />}
                <span>{message}</span>
              </div>
            </div>
          )}
          <div className="flex justify-end gap-4">
            <Button type="button" onClick={resetForm} className="bg-gray-200 text-gray-800 hover:bg-gray-300">
              Reset Form
            </Button>
            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
};