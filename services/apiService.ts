import { User } from '../types';

// PENTING: Ganti dengan URL Web App Anda dari Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbyWRffK9AZefBu9NZvCWyj_BgShFzIA65TL8KWkGJWQAjtZCILIx5pQAsDJR3zWN7cUhQ/exec";

/**
 * Mengirim laporan STTK baru ke Google Apps Script menggunakan metode satu langkah (Base64).
 * @param reportData Objek data laporan lengkap, termasuk file dalam format Base64.
 */
export const addSttkReport = async (reportData: any) => {
   try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      // Mode 'no-cors' bisa membantu melewati beberapa masalah CORS, tapi Anda tidak akan bisa membaca responsnya.
      // Jika masih ada masalah, ini bisa jadi salah satu penyebabnya. Untuk sekarang kita gunakan mode standar.
      // mode: 'no-cors', 
      body: JSON.stringify({ action: 'addReport', data: reportData }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    if (!response.ok) {
        // Coba baca respons error jika ada
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    const result = await response.json();

    if (result.status === 'success') {
        return { success: true, message: 'Laporan berhasil dikirim!', data: result };
    } else {
        return { success: false, message: result.message || 'Gagal mengirim laporan.' };
    }
  } catch (error) {
    console.error("Error submitting report:", error);
    // Tampilkan pesan error yang lebih detail
    return { success: false, message: `Terjadi kesalahan: ${error.message}` };
  }
};


// --- FUNGSI LAIN (TIDAK PERLU DIUBAH) ---
export const loginUser = async (username, password): Promise<User | null> => {
  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'loginUser', data: { username, password } }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.status === 'success' && result.user) return result.user;
    return null;
  } catch (error) {
    console.error("Error during login:", error);
    return null;
  }
};

export const getDropdownOptions = async () => {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getDropdownOptions`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.status === 'success') return result.data;
    throw new Error(result.message || 'Failed to fetch dropdown options.');
  } catch (error) {
    console.error("Error fetching dropdown options:", error);
    return { amOptions: [] };
  }
};

export const getAllReports = async () => {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getAllReports`, { method: 'GET', redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    if (result.status === 'success') return result.data;
    throw new Error(result.message || 'Failed to fetch reports from API.');
  } catch (error) {
    console.error("Error fetching reports:", error);
    throw error;
  }
};

export const approveSttkReport = async (reportId: string | number) => {
   try {
    const response = await fetch(WEB_APP_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'approveReport', data: { id: reportId } }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error("Error approving report:", error);
    return false;
  }
};

export const exportReportsAsXLS = async (): Promise<string> => {
  try {
    const response = await fetch(`${WEB_APP_URL}?action=getCSVData`, { method: 'GET', redirect: 'follow' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    console.error("Error exporting XLS data:", error);
    throw error;
  }
};