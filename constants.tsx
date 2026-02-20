
import { House, Category, EventType, ParticipantType, Event } from './types';

export const HOUSE_CONFIG = {
  [House.Bendahara]: { color: '#2E7D32', bg: 'bg-green-700', text: 'text-green-700' },
  [House.Temenggung]: { color: '#C62828', bg: 'bg-red-700', text: 'text-red-700' },
  [House.Laksamana]: { color: '#1565C0', bg: 'bg-blue-700', text: 'text-blue-700' },
  [House.Syahbandar]: { color: '#F9A825', bg: 'bg-yellow-500', text: 'text-yellow-500' },
};

export const INDIVIDUAL_POINTS = [5, 3, 2, 1, 1]; 
export const GROUP_POINTS = [10, 6, 4, 2, 2];
export const RECORD_BONUS = 2;

export const MASTER_STUDENT_NAMES = [
  "CHE MUHAMAD SYAMSUL IQRAM BIN CHE ROSMADI", "DARWISH BIN MOHD SHUKRI", "MUHAMMAD AMMAR QUSYAIRI BIN ZAINAL",
  "MUHAMMAD FIRASH DANIEL BIN MUHAMMAD SYAFIQ", "MUHAMMAD HABIB HAIKAL BIN MOHD FADILLAH", "MUHAMMAD HAIKAL HANIF BIN KAIROLBAHARIM",
  "MUHAMMAD HAZWAN HUSYAIRIE BIN ABDUL MUHAIMIN", "MUHAMMAD KHALISH ARYAN BIN MOHD KAMAL", "MUHAMMAD NAUFAL WAQIUDDIN BIN ZULKIFLI",
  "MUHAMMAD RIDHWAN BIN MOHD SHAZLAN DAILAMIE", "NAZRIN RAFIQ BIN MOHD NAZARUDDIN", "SHAFIQ FAIZOL ADZLI BIN CHE ROSLI",
  "TUAN MUHAMMAD DANIEY HAKIMIEY BIN TUAN SYAHRUL NIZAN", "ZUL IQRAM DARWISH BIN ZULKIFLI", "FAIQA MALIHAH BINTI FAISAL",
  "FAIQA MAWADDAH BINTI FAISAL", "NUR AIRIS QISTINA BINTI MOHD HAFIZ", "NUR ALIA NATASHA BINTI MUHAMMAD DAUD",
  "NURAIN QISTINA ERMANY BINTI AFFANDI", "NURUL DANIA SAFIYYA BINTI RAMLI", "NURUL NAJWA BINTI MOHD SAIFULLIZAM",
  "PUTERI DALIANA QAISARA BINTI ABDUL LATIF", "SYARIFAH NUR AISYAH UMAIRAH BINTI SYED MOHD NAZIR", "WAN AMMNI QISTINA BINTI WAN KAMRU ZAMAN",
  "WAN NUR ALIYSHA BINTI WAN AHMAD", "ZAFIRAH AMANI BINTI ABDUL AZIZ"
];

export const MASTER_CLASSES = [
  "1 AL HAMBALI", "1 AL MALIKI", "1 AL SYAFIE",
  "2 AL HAMBALI", "2 AL MALIKI", "2 AL SYAFIE",
  "3 AL HAMBALI", "3 AL MALIKI", "3 AL SYAFIE",
  "4 AL-HAMBALI", "4 AL-MALIKI", "4 AL-SYAFIE",
  "5 AL HANAFI", "5 AL-HAMBALI", "5 AL-MALIKI", "5 AL-SYAFIE"
];

// Jana Senarai Acara Induk secara dinamik berdasarkan spesifikasi
const generateMasterEvents = (): Event[] => {
  const categories = [Category.L1, Category.L2, Category.P1, Category.P2];
  const events: Event[] = [];

  const individualTrack = ["100M", "200M", "400M", "800M"];
  const individualField = ["Lompat Jauh", "Melontar Peluru", "Merejam Lembing", "Lempar Cakera", "Lompat Tinggi"];
  const groupTrack = ["4x100M", "4x400M"];

  // Individu Balapan
  individualTrack.forEach(name => {
    categories.forEach(cat => {
      events.push({ id: `track-ind-${name}-${cat}`, nama_acara: name, kategori: cat, jenis_acara: EventType.Track, jenis_peserta: ParticipantType.Individual });
    });
  });

  // Individu Padang
  individualField.forEach(name => {
    categories.forEach(cat => {
      events.push({ id: `field-ind-${name}-${cat}`, nama_acara: name, kategori: cat, jenis_acara: EventType.Field, jenis_peserta: ParticipantType.Individual });
    });
  });

  // Berkumpulan Balapan
  groupTrack.forEach(name => {
    categories.forEach(cat => {
      events.push({ id: `track-grp-${name}-${cat}`, nama_acara: name, kategori: cat, jenis_acara: EventType.Track, jenis_peserta: ParticipantType.Group });
    });
  });

  // Acara Terbuka
  events.push({ id: 'field-grp-tarik-tali', nama_acara: "Tarik Tali", kategori: Category.Terbuka, jenis_acara: EventType.Field, jenis_peserta: ParticipantType.Group });

  return events;
};

export const MASTER_EVENTS = generateMasterEvents();
