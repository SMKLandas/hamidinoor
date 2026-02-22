
export enum HouseName {
  BENDAHARA = 'Bendahara',
  TEMENGGUNG = 'Temenggung',
  LAKSAMANA = 'Laksamana',
  SYAHBANDAR = 'Syahbandar'
}

export type Category = 'L15' | 'L18' | 'P15' | 'P18';
export type EventType = 'Balapan' | 'Padang';
export type ParticipantType = 'Individu' | 'Berkumpulan';

export interface Student {
  id: string;
  noBadan: string;
  nama: string;
  tingkatan: string;
  kategori: Category;
  rumahSukan: HouseName;
}

export interface SportsEvent {
  id: string;
  namaAcara: string;
  kategori: Category;
  jenisAcara: EventType;
  jenisPeserta: ParticipantType;
}

export interface Participation {
  id: string;
  studentId: string;
  eventId: string;
}

export interface Result {
  id: string;
  eventId: string;
  studentId: string;
  kedudukan: number; // 1 to 5
  catatan: string;
  rekodBaru: boolean;
  points: number;
}

export interface ScheduleItem {
  id: string;
  masa: string;
  acara: string;
  lokasi: string;
  pusingan: string;
  status: 'Akan Datang' | 'Sedang Berlangsung' | 'Selesai';
}

export interface HouseStats {
  name: HouseName;
  points: number;
  rank: number;
}
