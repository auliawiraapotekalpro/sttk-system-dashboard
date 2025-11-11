export interface Employee {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  masaKerja: string;
}

export interface User {
  username: string;
  role: 'Manager' | 'Area Manager';
}
