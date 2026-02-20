
export enum House {
  Bendahara = 'Bendahara',
  Temenggung = 'Temenggung',
  Laksamana = 'Laksamana',
  Syahbandar = 'Syahbandar'
}

export enum Category {
  L1 = 'L1', // Lelaki T1, T2, T3
  P1 = 'P1', // Perempuan T1, T2, T3
  L2 = 'L2', // Lelaki T4, T5
  P2 = 'P2', // Perempuan T4, T5
  Terbuka = 'Terbuka'
}

export enum EventType {
  Track = 'Balapan',
  Field = 'Padang'
}

export enum ParticipantType {
  Individual = 'Individu',
  Group = 'Berkumpulan'
}

export enum ParticipationRole {
  Main = 'Utama',
  Reserve = 'Simpanan'
}

export interface Student {
  id: string;
  no_badan: string;
  nama: string;
  tingkatan: string;
  kategori: Category;
  rumah: House;
  jenis_kelamin: 'Lelaki' | 'Perempuan';
}

export interface Event {
  id: string;
  nama_acara: string;
  kategori: Category;
  jenis_acara: EventType;
  jenis_peserta: ParticipantType;
}

export interface Participation {
  id: string;
  studentId: string;
  eventId: string;
  role: ParticipationRole;
}

export interface Schedule {
  id: string;
  eventId: string;
  masa: string;
  lokasi: string;
  pusingan: string;
}

export interface Result {
  id: string;
  eventId: string;
  studentId: string;
  tempat: number;
  hasil: string;
  bonusRekod: boolean;
}

export interface HouseScore {
  house: House;
  totalPoints: number;
}
