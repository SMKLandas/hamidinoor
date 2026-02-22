import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, 
  Medal, 
  PlusCircle, 
  List, 
  LayoutDashboard, 
  Download, 
  Trash2, 
  ChevronRight,
  Award,
  Users,
  Calendar,
  Search,
  AlertCircle,
  UserPlus,
  CheckCircle2,
  ClipboardList,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// --- Types & Constants ---

enum HouseName {
  TEMENGGUNG = 'Temenggung',
  SYAHBANDAR = 'Syahbandar',
  LAKSAMANA = 'Laksamana',
  BENDAHARA = 'Bendahara'
}

interface ResultEntry {
  id: string;
  eventName: string;
  category: string;
  house: HouseName;
  position: 1 | 2 | 3 | 4;
  athleteName: string;
  points: number;
  timestamp: number;
}

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
}

interface AthleteRegistration {
  id: string;
  athleteName: string;
  house: HouseName;
  eventName: string;
  category: string;
  kelas: string;
  type: 'Utama' | 'Simpanan';
  eventType: 'Balapan' | 'Padang' | 'Terbuka';
}

const EVENTS_CONFIG = {
  Balapan: [
    { name: '100M', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: '200M', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: '400M', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: '800M', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: '4x100M', quotas: { L1: [4, 1], L2: [4, 1], P1: [4, 1], P2: [4, 1] } },
    { name: '4x400M', quotas: { L1: [4, 1], L2: [4, 1], P1: [4, 1], P2: [4, 1] } },
  ],
  Padang: [
    { name: 'Lompat Jauh', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: 'Melontar Peluru', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: 'Merejam Lembing', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: 'Lempar Cakera', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
    { name: 'Lompat Tinggi', quotas: { L1: [2, 1], L2: [2, 1], P1: [2, 1], P2: [2, 1] } },
  ],
  Terbuka: [
    { name: 'Tarik Tali', quotas: { Terbuka: [10, 2] } }
  ]
};

const CATEGORY_MAP = {
  L1: 'Lelaki T4, T5',
  L2: 'Lelaki T1, T2, T3',
  P1: 'Perempuan T4, T5',
  P2: 'Perempuan T1, T2, T3',
  Terbuka: 'Tanpa Mengira Umur'
};

const HOUSE_CONFIG = {
  [HouseName.TEMENGGUNG]: { color: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', light: 'bg-red-50' },
  [HouseName.SYAHBANDAR]: { color: 'bg-yellow-400', text: 'text-yellow-700', border: 'border-yellow-200', light: 'bg-yellow-50' },
  [HouseName.LAKSAMANA]: { color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', light: 'bg-blue-50' },
  [HouseName.BENDAHARA]: { color: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', light: 'bg-green-50' },
};

const SCORING_LOGIC = {
  1: 7, // Emas
  2: 5, // Perak
  3: 3, // Gangsa
  4: 1  // Tempat Ke-4
};

const CATEGORIES = ['L1', 'P1', 'L2', 'P2', 'L3', 'P3', 'Terbuka'];

const STUDENTS_LIST = [
  "CHE MUHAMAD SYAMSUL IQRAM BIN CHE ROSMADI",
  "DARWISH BIN MOHD SHUKRI",
  "MUHAMMAD AMMAR QUSYAIRI BIN ZAINAL",
  "MUHAMMAD FIRASH DANIEL BIN MUHAMMAD SYAFIQ",
  "MUHAMMAD HABIB HAIKAL BIN MOHD FADILLAH",
  "MUHAMMAD HAIKAL HANIF BIN KAIROLBAHARIM",
  "MUHAMMAD HAZWAN HUSYAIRIE BIN ABDUL MUHAIMIN",
  "MUHAMMAD KHALISH ARYAN BIN MOHD KAMAL",
  "MUHAMMAD NAUFAL WAQIUDDIN BIN ZULKIFLI",
  "MUHAMMAD RIDHWAN BIN MOHD SHAZLAN DAILAMIE",
  "NAZRIN RAFIQ BIN MOHD NAZARUDDIN",
  "SHAFIQ FAIZOL ADZLI BIN CHE ROSLI",
  "TUAN MUHAMMAD DANIEY HAKIMIEY BIN TUAN SYAHRUL NIZAN",
  "ZUL IQRAM DARWISH BIN ZULKIFLI",
  "FAIQA MALIHAH BINTI FAISAL",
  "FAIQA MAWADDAH BINTI FAISAL",
  "NUR AIRIS QISTINA BINTI MOHD HAFIZ",
  "NUR ALIA NATASHA BINTI MUHAMMAD DAUD",
  "NURALIA NATASHA BINTI MUHAMMAD DAUD",
  "NURAIN QISTINA ERMANY BINTI AFFANDI",
  "NURUL DANIA SAFIYYA BINTI RAMLI",
  "NURUL NAJWA BINTI MOHD SAIFULLIZAM",
  "PUTERI DALIANA QAISARA BINTI ABDUL LATIF",
  "SYARIFAH NUR AISYAH UMAIRAH BINTI SYED MOHD NAZIR",
  "WAN AMMNI QISTINA BINTI WAN KAMRU ZAMAN",
  "WAN NUR ALIYSHA BINTI WAN AHMAD",
  "ZAFIRAH AMANI BINTI ABDUL AZIZ",
  "AISY HAIQAL NUR-IMAN BIN MOHD ZAIDI",
  "AMMAR HARRAZ BIN MOHD AZLAN",
  "IBNU QAYYUM BIN ROSLI",
  "IKRAM JAILANI BIN SUFIAN",
  "KU MUHAMMAD ZHARIF ARYAN BIN KU AHMAD FAIZI",
  "MOHAMMAD IZHAN MUSLIM BIN MOHD SAIFUL NIZAR",
  "MUHAMMAD AIDIL AMSHAR BIN MAT ZULKEFLI",
  "MUHAMMAD ILHAM RIZQIE BIN MOHD RIZUAN",
  "MUHAMMAD NURAFIQ ZAHIM BIN MOHD BARIZAN",
  "MUHAMMAD SHARHAN BIN ZAMANI",
  "TG NOR KHALISH RASHDAN BIN TG AZRI",
  "DHIYA ADELIA SAFIYYAH BINTI MOHD NASIR",
  "INTAN DANIA DANISH BINTI MOHD KHAIRIL AZHAR",
  "MEDINNA ZEHRA BINTI MOHD MUHAIZUL",
  "MELLISA DIANA BINTI NOR AZMI TARMIZEE",
  "NUR ALISHA SAFIYA BINTI MOHD HAFIZ",
  "NUR ANIS SYAKIRA BINTI MOHAMAD NOR IZWAN",
  "NUR AUFA ZARA BINTI MOHD ZUL FAHMIE",
  "NUR BALQIS MAISARAH BINTI MUHAMMAD AZREAN",
  "NUR DHIA AMANDA BINTI MOHAMMAD ZEIREE",
  "NUR FATIHAH UZWA BINTI ABDULLAH",
  "NUR LAIYA SYAFARADANI BINTI SAZALI",
  "NUR QISYA ADELIA BINTI AZMAN",
  "NUR SYAWANI AFIQAH BINTI AZIZOL",
  "NURUL AISYA AQIRA BINTI MOHD",
  "NURUL ASMIDA EZRIN BINTI MD SALMIZANI",
  "SHUHADA BINTI AWANG",
  "ABDULLAH FARISHD BIN MADZLIN",
  "MUHAMAD MIKAIL IZZ HAIKAL BIN MOHD AS'ARI",
  "MUHAMMAD AL QAYYIM AMJAD BIN MOHD FAIZAL",
  "MUHAMMAD ANNAS HAMADI BIN RIZAMAN",
  "MUHAMMAD HAFIZAL BIN MOHD YASSIN",
  "MUHAMMAD IMAN KHALID BIN MUHAMMAD RABBI",
  "MUHAMMAD LUQMAN BIN MOHD NORHAFIZUDDIN SYAH",
  "WAN MOHAMAD IZZUL IRSYAD BIN WAN ROSLAN",
  "ANNUR AISYATUL SYIFA BINTI AZRIL HAFDIZ",
  "DHIYA KHAYLA QAISARA BINTI MOHD HASLIZAN",
  "NIK NUR IMAN ABYANA BINTI MUHAMAD SOFIAN",
  "NUR ALYAA BATRISYIA BINTI RAMLI",
  "NUR AMRINA RASYADA BINTI MOHD HIFZHAN",
  "NUR DAMIA LIYANA KHAIZARA BINTI KHAIRIL HAZLI",
  "NUR DAMIA QAISARA BINTI MOHD RIDZUAN",
  "NUR ZAHRAA AISYAH BINTI MOHAMMAD SYAFIQ",
  "NURUL SYIFA ATIQAH BINTI MOHD SUKRI",
  "SITI NUR HADIRAH BINTI AYOB",
  "WAN NUR AL SYAQIRIN BINTI WAN MOHD SUKRI",
  "WAN NUR ARISSA IMANI BINTI WAN RASLI",
  "WAN NUR ZARA IRDINA BINTI WAN MOHD ZULKIFLI",
  "AHMAD DZULFIQAR BIN AHMAD SAYUTI",
  "ARISF BIN ANUAR",
  "KHAIRUL AIDIL NUFAEL BIN KAMARUL BAHAMAN",
  "MUHAMMAD ADAM SYAFIQ BIN MOHD SHARUDDIN",
  "MUHAMMAD ASRI BIN SUFIAN",
  "MUHAMMAD AZEEM FAQHRY BIN NOR AZMI TARMIZEE",
  "MUHAMMAD FAHRIN HAIKAL BIN MOHD FADILLAH",
  "MUHAMMAD FAIQ HAFIZH BIN FAISA MAZLIM",
  "MUHAMMAD FAKHRUL FAIZ BIN MOHD ZAKI",
  "MUHAMMAD HAIKAL DANISH BIN ZUN @ ZULKIFLI",
  "MUHAMMAD HARIS LUKHMAN BIN HISHAMBUDDIN",
  "MUHAMMAD NAQIB AZWAR BIN RIZUAN",
  "MUHAMMAD NUR FIRDAUS BIN MOHD SOFRI",
  "MUHAMMAD SYAFIQ NAIM BIN ROSHDI",
  "TENGKU MUHAMMAD ADHA SYAKIRIN BIN TENGKU HAMAT",
  "ARISSA QAISARA BINTI MOHD FADRUL",
  "DAHLIA DAFINA BINTI ABDUL HAKIM",
  "NOOR SALSAZIRA BINTI AZMI",
  "NOR AMALINA AMANI BINTI NORAPIZAN",
  "NUR ALYAA' SYAZANA BINTI AZHAR",
  "NUR AMIERA DAHLIA BINTI RAMZI",
  "NUR HIDAYAH BINTI GHAZALI",
  "NUR IRIS SAFIYA BINTI MOHD FAIZAL",
  "NUR UMMAIRAH SYAKINAZ BINTI MOHD FAIZAL",
  "NUR ZAHIRAH BINTI MOHD RUSDI",
  "NUR ZAHIRAH NABIHAH BINTI ABDUL GHANI",
  "NURUL NAZIRA IZZANI BINTI MD SALMIZANI",
  "QASEH QALISHA BINTI ABDUL HAFIZ",
  "ADAM HAQIMIE BIN ZAINUDDIN",
  "AHMAD AMSHAR BIN MOHD FAZLIN",
  "AMIR ZILL ASYRAF BIN AMIR KHALED",
  "D'ANAS ADRIAN BIN DZULKIFLI",
  "MOHAMAD AQEEF RAYYAN BIN MOHD IDZUAN",
  "MOHAMMAD AMIRUL HAKIM BIN AHMAD RAFAIE",
  "MUHAMMAD AL HAKIMI BIN MOHD NOH",
  "MUHAMMAD AMIRUL HAKIM BIN MOHD RIDZUAN",
  "MUHAMMAD AMMAR SYAZWAN BIN KHAIRIL HAZLI",
  "MUHAMMAD AZFAR HAFIZ BIN MOHD HELMI",
  "MUHAMMAD HAFIY ELHAM BIN MUHAMAD HAFIZI",
  "MUHAMMAD HUSNUL IMAN BIN TAMIZI",
  "SHAHRUL ISKANDAR BIN ABDULLAH",
  "WAN MOHAMAD AZRIL WAIMAN BIN WAN MOHD SYUKRI",
  "AISARA HUMAIRA BINTI RIZAL JAMALULLAIL",
  "AN NUR DAMIA UMAIRA BINTI MOHD ZAMRI",
  "AQILAH ZAHRA BINTI MOHD ZAHILI",
  "FATIN NURDAMIA BINTI SAUPI",
  "NIK NUR AISYAH BINTI NIK MUHAMAD HAFIZ",
  "NUR AIRYSHA INSYIRAH BINTI MOHD KAMAL ZULKIFLI",
  "NUR AMMENA UMAIRAH RASHIQA BINTI ZAWAWI",
  "NUR ELYSHAFIRA BINTI MAZLAN",
  "NUR MARISSA QAISARA BINTI SUHAIMI",
  "NUR NAZEEHA BINTI MOHD ALIAS",
  "NUR SYAFIQAH AMIRAH BINTI ABDULLAH",
  "MUHAMMAD ADAM HARRIS BIN MOHD FAUZI",
  "MUHAMMAD AKID BIN KHAIRUDIN",
  "MUHAMMAD AMZAR MIRZA BIN MOHD TAMIMI",
  "MUHAMMAD ARSYAD SAFIUDDIN BIN AZRIL HAFDIZ",
  "MUHAMMAD HAFIDH IDLAN BIN MOHD SHARIF",
  "MUHAMMAD ILHAM FARRIS BIN MOHD SYAHRUL FADLEYSYAM",
  "MUHAMMAD SYAAKIR AMEEN BIN MOHD SAHRIL",
  "MUHAMMAD ZHAFRAN BIN MOHD ZULKIFLI",
  "MUKHRIZ BIN MUZIR",
  "NASRUNISMADI BIN ZAKARIA",
  "TUAN MUHAMMAD ARASY ARSYAD BIN TUAN FAIZOL RIZAN",
  "ZULFAZLI BIN ZUZUKI",
  "NUR AIESHA NAZIIHAH BINTI MOHAMAD ANUAR",
  "NUR AUNI AQILAH BINTI AIMAN",
  "NUR BALQIS DAMIA SORFINA BINTI MOHD HAFIZ",
  "NUR EIMAN EIZAJANNAH BINTI ROHADI",
  "NUR SYASHA ELYANA BINTI MOHD RIZUAN",
  "SITI SURIA SYAFIQAH BINTI MOHD BUKARIM",
  "AHMAD HADIF BIN MOHD SUKRI HAMIDI",
  "AMMAR ARFAN BIN AZIZI",
  "FARISH HADIF BIN FAISA MAZLIM",
  "FARISH HASIF BIN FAISA MAZLIM",
  "MUHAMMAD ADAM FARISHANIF BIN RAZAMI",
  "MUHAMMAD ASYRAAF MUHAIMIN BIN ZAKI",
  "MUHAMMAD AZRI IZZUDIN BIN RAMI LADEN",
  "MUHAMMAD FARHAN BIN ABD HALIM",
  "MUHAMMAD FIRDAUS AL HAFIZ BIN SHAM SULIMAN",
  "MUHAMMAD HAIQAL BIN ZUKERI",
  "MUHAMMAD KHAIRUL AZWAN BIN MOHD KAMARUZAMAN",
  "MUHAMMAD SHAHRIL FARHAN BIN MOHAMAD SAKRI",
  "MUHAMMAD SHAKIR DARWISY BIN MOHD SYAMSUL BAHARI",
  "MUHAMMAD SYAFIIE BIN SAMSUDDIN",
  "MUHAMMAD SYAMIM DANISH BIN MOHD SHAFIZA",
  "WAN MUHAMMAD AFKAR BIN WAN HASSAN",
  "DAMIA BINTI MOHD SHUKRI",
  "NUR ALLISYA UMAIRA DANIA BINTI MOHAMMAD SHAM ASROY",
  "NUR ALYA INSYIRAH BINTI CHE MOHD ZAIDI",
  "NUR AQILAH ZAHIDAH BINTI AWANG",
  "NUR LIYANA NASUHA BINTI MOHD SHAZLAN DAILAMIE",
  "NURUL FARAH DAMIA BINTI LUTFI",
  "QASEH FARISHA AMIRA BINTI ARIFFIN",
  "SHARIFAH SYAZA AMANI BINTI SYED AHMAD SAHABUDDIN",
  "ABDULLAH FAHMI BIN ABDULLAH",
  "AFIQ FARHAN ZIQRI BIN SAMRI",
  "AHMAD YUSUF FARHAN BIN ZAMRI",
  "HARITH AMNAN BIN MOHD REDZUAN",
  "MOHAMAD NOR IQBAL BIN MOHAMAD RIDZUAN",
  "MUHAMMAD AMILRUL HAKIM BIN ABU BAKAR",
  "MUHAMMAD AQIL BIN MOHAMMAD MUSTAKIM",
  "MUHAMMAD NUR IRZAN BIN MOHD NAZRI",
  "SYAKIR NAEIMAN BIN SHAHRUL NIZAM",
  "NOOR ATIQAH BINTI MOHD NOOR",
  "NOR QARIMAH ANNISA BINTI MOHD ZUKI",
  "NUR ADIANA KALISHA BINTI ABDULLAH",
  "NUR AINA BINTI ZAMRI",
  "NUR ALYA BATRISYA BINTI AHMAD ZAKI",
  "NUR ALYA NAFISYA BINTI MOHD SAIFUL NIZAR",
  "NUR AMIRA SOLEHAH BINTI ABDULLAH",
  "NUR ANEESA SYAHIRA BINTI MOHD NASIR",
  "NUR ANIS ADILA BINTI MOHAMAD AZROL",
  "NUR HANIS HALISYA BINTI MOHD AZMI",
  "NUR IRDINA MARSYA BINTI MOHD IRWAN",
  "NUR MAZARINA BINTI SAMSUDDIN",
  "NUR ZAFIRA AILA BINTI MUHAMMAD ZAINI",
  "NURUSSA'ADAH BINTI RAZMIDI",
  "SITI NUR ZAHIRAH BINTI MURAD",
  "WAN NURUL AINUL NADHIRAH BINTI WAN MOHD YUSOF",
  "ADAM HAIKAL BIN ISMAIL",
  "AHMAD YUSUF FAHMI BIN ZAMRI",
  "MUHAMMAD AMSYAR MIRZA BIN MOHD TAMIMI",
  "MUHAMMAD RAFI'UDDIN BIN ROSLAN",
  "MUHAMMAD SYAHMI ZUFAYRI BIN MOHD SUHAIMI",
  "MUHAMMAD ZIKIR BIN ZAMANI",
  "WAN NAQIUDDIN AZIM BIN WAN BISTAMIN",
  "AINUR ALISA BINTI DZULKIFLI",
  "ANIS FARISHA BINTI AHMAD SANUSI",
  "CHE NUR QISTINA UMAIRAH BINTI CHE ROSMADI",
  "CHE URYA INSYIRAH BINTI MOHAMAD SHUKRI",
  "NIK ZAHRA MAISARA BINTI NIK SYUKRI",
  "NUR ALEESYA YASMIN BINTI MOHAMAD ZURAIDI",
  "NUR ANISA ALIYANA BINTI MOHD FADLUR RAHMAN",
  "NUR DAMIA ERISYA BINTI MOHD YUSOF",
  "NUR QURRATUL AINI BINTI KAMARUDDIN",
  "NUR SYAHIRAH FAZRINA BINTI ABDULLAH",
  "NURSYAKIRA ZULFAH BINTI MUHAMMAD",
  "SITI AISYAH BINTI MOHD RASHID",
  "SUHAILA BINTI AWANG",
  "WAN NUR DANISHSYA FARISYA BINTI WAN MOHD SUKRI",
  "AHMAD FIRDAUS BIN HASIM",
  "AIMAN BIN AHMAD SUHARDY",
  "DZUL IRWAN BIN ZULKIFLI",
  "MOHAMAD AZMI BIN MOHD RUJIDIN",
  "MOHAMMAD FAIEZ AIMAN BIN ABDUL RAHMAN",
  "MUHAMMAD AIDIL IKHWAN BIN MOHD ABDUL SALAM",
  "MUHAMMAD AMIR DANIAL BIN JAFFAR",
  "MUHAMMAD AQIL DANISH BIN ZULKIFLI",
  "MUHAMMAD IDHAM BIN MAZALAM",
  "MUHAMMAD IKRAM DANIEL BIN ABDULLAH",
  "MUHAMMAD NUBHAN AIMAN BIN ABDULLAH",
  "MUHAMMAD SHAZUAN SHAH BIN ROSIDI",
  "NAIM NAZMI BIN MOHD NAZARUDDIN",
  "WAN MUHAMMAD ADAM DANIAL BIN ABDULLAH",
  "WAN MUHAMMAD ANIQUE HILMI BIN WAN KAMRU ZAMAN",
  "WAN MUHAMMAD AZWAR BIN WAN MOHD TARMIZI",
  "WAN SAIFUL AZAM BIN WAN MOHD SHAHRIL",
  "BATRISYA IZZATI BINTI MOHD SAIFULLIZAM",
  "FAQIHAH BINTI MOHD EDI FADLI",
  "INTAN DURRANI DANISH BINTI MOHD KHAIRIL AZHAR",
  "SITI NUR DAMIA SYAMIMI BINTI MOHD RIDZUAN",
  "ZULAIKHA HUMAIRA BINTI MOHD ZAKHIRI",
  "CHE AKIF ASYRAAF BIN CHE ROSMIZAM",
  "MUHAFIAN BIN ABDUL RAZAK",
  "MUHAMMAD ADAM SHAMIL BIN MOHD SAYUTI",
  "MUHAMMAD AQIF KHAIRUDDIN BIN SHAROL NIZAM",
  "MUHAMMAD ATIF HUZAIMAN BIN ABDULLAH",
  "MUHAMMAD HAIKAL BIN SANUSI",
  "SHAFIQ RAMDAN FAIZI BIN CHE ROSLI",
  "TENGKU MUHAMMAD AKMAL MUHAIMIN BIN SUFIAN",
  "WAN MUHAMMAD AQIL DARWISH BIN WAN MOHD RIZAL",
  "AINA NABIHAH BINTI ZAHARI",
  "AQILAH QISTINA BINTI ZULBAHARIN",
  "DAMIA DARWISYAH BINTI AHMAD",
  "FAEIZIA MAYESA BINTI FAISAL",
  "NUR AINANADIA BINTI NOR AZMI",
  "NUR ALIYA ATIKAH BINTI MOHD NOH",
  "NUR ALYAA FARHANA BINTI RIZAMAN",
  "NUR ARINA BATRISYA BINTI ZAINUDDIN",
  "NUR KHAIRINNATASYA BINTI KHAIRUDI",
  "NUR LIYANA HUMAIRA BINTI ABDULLAH",
  "NUR QISHA QAISARA BINTI MOHD NUZUL HAKIMI",
  "NUR UMAIRAH SYAHMINA BINTI MOHD KAMARUZAMAN",
  "NURUL NAJWA BINTI KAMARUL ZAMAN",
  "NURUL SYUHADA BINTI MAT YAMAN",
  "QASEH QALESYA BINTI MOHAMAD",
  "SITI AIDA NATAHSA BINTI MOHD NORZAKI",
  "SITI HANIS SYAFIQAH BINTI AYOB",
  "SITI NURBALQIS BINTI MOHD ZULKAFLI",
  "WAN NUR QALESYA BINTI WAN SAIFULBAHRIM",
  "MUHAMMAD AZIM BIN MOHD ZULKARNAEN",
  "MUHAMMAD HAZIQ BIN ISHAHMUDDIN",
  "WAN RAFIUDDIN AFSAL BIN WAN BISTAMIN",
  "MAYA QISTINA BINTI ABDULLAH",
  "NISRIN ASYRANI BINTI KHAIRUDIN",
  "NUR AIRA SOFIA BINTI ZULKIFLI",
  "NUR ANISYAH BINTI MAZLAN",
  "NUR DAMIA QISTINA BINTI SUHAIMI",
  "NUR IMAN UMAIRA BINTI MOHD SYAHRUL FADLEYSYAM",
  "NUR KAMILIA FARHANA BINTI MOHD KHAIRUL AZWAN",
  "SITI ALIA FAZLIANA BINTI PAZLI @ MOHD PAZLI",
  "SITI NADYA BINTI IBRAHIM",
  "SITI NUR ADIERA FATHIAH BINTI MOHD SHAMPIAH",
  "WAN NUR DAMIA ADLINA BINTI WAN SHAHFYZULLAH",
  "AHMAD FAKHRUDDIN BIN ANUAR",
  "D'ADAM RAYEAN BIN DZULKIFLI",
  "IMADUDDIN ZULHUSNI BIN YUSSOF",
  "ISMA HARIS BIN SABRI",
  "MOHD ZAFRIE SHAH BIN MUHAMMAD ZAINI",
  "MUHAMAD DAMIAN HADZIQ BIN MOHD RIDZUAN",
  "MUHAMMAD AMIRUL AIMAN BIN MOHD YUSOF",
  "MUHAMMAD HADZRIQ IRSHAD BIN MOHD SHARIF",
  "MUHAMMAD HARIZ BIN ZAHARI",
  "MUHAMMAD RAFIEQZ DARWISY BIN ABDULLAH",
  "MUHAMMAD THAQIFUDDIN BIN MOHD HELMI",
  "PUTERA AHMAD ADIL BIN MOHAMAD SAKRI",
  "WAN DANISH SYAHMI BIN WAN MOHD SHAHRIL",
  "WAN HAZRIQ BIN WAN AHMAD",
  "WAN MUHAMMAD IQBAL BIN WAN MOHD SHAFFIE",
  "AZRI AFIQ BIN AZIZI",
  "MUHAMAD ALIF IKWAN BIN BAHARUDDIN",
  "MUHAMMAD ADAM FARIS BIN BADERI @ NAZRI",
  "MUHAMMAD AIMAN HAIKAL BIN RAMLI",
  "MUHAMMAD HAFIZ HAIQAL BIN MOHD JUM HARIRAN",
  "MUHAMMAD IKMAL HAKIM BIN MOHD FAIZAL",
  "MUHAMMAD RIZMAN BIN JOHAN",
  "MUHAMMAD YUSUFF HAIKAL BIN MOHD SHUKRI",
  "ZULKHAIMI BIN ZULKIFLEE",
  "IWANA FAKHIRA BINTI HASSAN",
  "NORHAZIQAH BINTI AHMAD SAFILA",
  "NUR ADIANA ALEESYA BINTI ABDULLAH",
  "NUR AIN SYAFIQA BINTI MOHD ZAPANI",
  "NUR ALIYA SHAFIQAH BINTI ZULMI",
  "NUR AMELIA NATASHA BINTI ABDUL RAHMAN",
  "NUR AMIRAH DALILA BINTI YUSOF",
  "NUR INSYIRAH AYUNI BINTI MAT DIN",
  "NUR SUHAILA BINTI NGAH",
  "NURUL AIN SYAFINAZ BINTI MOHD FADILLAH",
  "NURUL AINA BALQIS BINTI ADENAN",
  "NURUL DAMIA ASHIKIN BINTI MOHAMAD NOR IZWAN",
  "SITI NUR AUNI FAREESYA BINTI ABDULLAH",
  "WAN SYARFA' HUMAIRA BINTI WAN MOHD SAHRUN",
  "ZARA NAJWA BINTI AMERANG",
  "ADAM DANIAL ZULBAHARIN BIN ABDUL HAFIZ",
  "AHMAD IRFAN BIN MOHD RIDHWAN",
  "MUHAMAD SAFWAN BIN AZAHARI",
  "MUHAMMAD DANISH ASYRAAF BIN MOHD KHAIRUL AZWAN",
  "MUHAMMAD SHAFIQ HAZIM BIN AB HALIM",
  "WAN HAZWAN AFIQ BIN WAN ABD MANAN",
  "ZULZIKRY BIN ZUKRI",
  "NOR AKMA ADILA BINTI MAZALAM",
  "NUR ADAWIYAH BINTI HALIAS",
  "NUR AUNI DAMIA BINTI ABDUL SALAAM",
  "NUR EIZYANIE EIFARHAH BINTI ROHADI",
  "NUR HANISAH BINTI ABDULLAH",
  "SITI SURIA RAMADHANI BINTI MOHD BUKARIM",
  "WAN NOR AYUNIE BINTI WAN HADI",
  "AHMAD SYAKIR AL ZULFAIRIE BIN MUHAMMAD",
  "AMSYAR MUSTAQIM BIN MOHD FAIZUL",
  "MUHAMMAD DANISH HAQEM BIN MOHD ADLI",
  "DAMIA FARISYA BINTI ABDULLAH",
  "DEYANA ARISYA BINTI MOHD TAUFIK",
  "FIRZANAH MUSFIRAH BINTI FAISAL",
  "NUR FARAHIYA BINTI HAMIDON",
  "NUR HAZLEEN IZYAN BINTI MOHD REDZUAN",
  "NUR LILY SHAMIMI BINTI SAZALI",
  "NUR MALIYANA BINTI SAMSUDDIN",
  "NURUL ALIS ARISYA BINTI RAMLI",
  "NURUL FATIHAH BINTI ABDUL MALIK",
  "NURUL IMAN BINTI MOHD ASMAWI"
];

const KELAS_LIST = [
  "1 AL HAMBALI", "1 AL MALIKI", "1 AL SYAFIE",
  "2 AL HAMBALI", "2 AL MALIKI", "2 AL SYAFIE",
  "3 AL HAMBALI", "3 AL MALIKI", "3 AL SYAFIE",
  "4 AL-HAMBALI", "4 AL-MALIKI", "4 AL-SYAFIE",
  "5 AL HANAFI", "5 AL-HAMBALI", "5 AL-MALIKI", "5 AL-SYAFIE"
];

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'results' | 'calendar' | 'registration' | 'starting-list' | 'judges-form'>('dashboard');
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [registrations, setRegistrations] = useState<AthleteRegistration[]>([]);
  
  const [selectedStartingEvent, setSelectedStartingEvent] = useState('');
  const [selectedStartingCategory, setSelectedStartingCategory] = useState('');

  const [selectedJudgesEvent, setSelectedJudgesEvent] = useState('');
  const [selectedJudgesCategory, setSelectedJudgesCategory] = useState('');

  const [formData, setFormData] = useState({
    eventName: '',
    category: '',
    house: HouseName.TEMENGGUNG,
    position: 0 as any,
    athleteName: ''
  });

  const [regFormData, setRegFormData] = useState({
    athleteName: '',
    house: HouseName.TEMENGGUNG,
    eventType: '' as any,
    eventName: '',
    category: '',
    kelas: '',
    type: '' as any
  });
  const [eventFormData, setEventFormData] = useState({
    title: '',
    date: '',
    time: '',
    location: ''
  });
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  const startingListRef = useRef<HTMLDivElement>(null);
  const judgesFormRef = useRef<HTMLDivElement>(null);

  // Load data from LocalStorage
  useEffect(() => {
    const savedResults = localStorage.getItem('smk_landas_results_2026');
    if (savedResults) {
      try {
        setResults(JSON.parse(savedResults));
      } catch (e) {
        console.error("Failed to parse saved results", e);
      }
    }

    const savedEvents = localStorage.getItem('smk_landas_events_2026');
    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error("Failed to parse saved events", e);
      }
    }

    const savedRegs = localStorage.getItem('smk_landas_regs_2026');
    if (savedRegs) {
      try {
        setRegistrations(JSON.parse(savedRegs));
      } catch (e) {
        console.error("Failed to parse saved registrations", e);
      }
    }
  }, []);

  // Save data to LocalStorage
  useEffect(() => {
    localStorage.setItem('smk_landas_results_2026', JSON.stringify(results));
  }, [results]);

  useEffect(() => {
    localStorage.setItem('smk_landas_events_2026', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('smk_landas_regs_2026', JSON.stringify(registrations));
  }, [registrations]);

  // Calculate Stats
  const houseStats = useMemo(() => {
    const stats = Object.values(HouseName).map(name => {
      const houseResults = results.filter(r => r.house === name);
      const totalPoints = houseResults.reduce((sum, r) => sum + r.points, 0);
      const medals = {
        gold: houseResults.filter(r => r.position === 1).length,
        silver: houseResults.filter(r => r.position === 2).length,
        bronze: houseResults.filter(r => r.position === 3).length,
        fourth: houseResults.filter(r => r.position === 4).length,
      };
      return { name, totalPoints, ...medals };
    });

    return stats.sort((a, b) => b.totalPoints - a.totalPoints);
  }, [results]);

  const handleAddResult = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventName || !formData.athleteName || !formData.category || !formData.position) {
      alert('Sila lengkapkan semua maklumat!');
      return;
    }

    const newEntry: ResultEntry = {
      id: crypto.randomUUID(),
      ...formData,
      points: SCORING_LOGIC[formData.position],
      timestamp: Date.now()
    };

    setResults([newEntry, ...results]);
    setFormData({
      ...formData,
      athleteName: '',
      position: 0 as any
    });
    alert('Keputusan berjaya ditambah!');
  };

  const handleDeleteResult = (id: string) => {
    if (window.confirm('Adakah anda pasti ingin memadam keputusan ini?')) {
      setResults(results.filter(r => r.id !== id));
    }
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventFormData.title || !eventFormData.date || !eventFormData.location) {
      alert('Sila lengkapkan maklumat acara!');
      return;
    }

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      ...eventFormData
    };

    setEvents([...events, newEvent].sort((a, b) => a.date.localeCompare(b.date)));
    setEventFormData({
      title: '',
      date: '',
      time: '',
      location: ''
    });
    alert('Acara berjaya ditambah ke kalendar!');
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('Adakah anda pasti ingin memadam acara ini?')) {
      setEvents(events.filter(e => e.id !== id));
    }
  };

  const handleAddRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const { athleteName, house, eventName, category, type, eventType, kelas } = regFormData;

    if (!athleteName) {
      alert('Sila masukkan nama atlet!');
      return;
    }

    if (!kelas) {
      alert('Sila pilih kelas!');
      return;
    }

    if (!eventType || !eventName || !category || !type) {
      alert('Sila lengkapkan semua maklumat pendaftaran!');
      return;
    }

    // 1. Quota Check
    const eventConfig = EVENTS_CONFIG[eventType].find(ev => ev.name === eventName);
    if (!eventConfig) return;
    
    const quota = eventConfig.quotas[category as keyof typeof eventConfig.quotas];
    if (!quota) {
      alert(`Kategori ${category} tidak tersedia untuk acara ini.`);
      return;
    }

    const currentRegs = registrations.filter(r => 
      r.eventName === eventName && 
      r.category === category && 
      r.house === house && 
      r.type === type
    );

    const maxQuota = type === 'Utama' ? quota[0] : quota[1];
    if (currentRegs.length >= maxQuota) {
      alert(`Kuota ${type} untuk ${house} dalam acara ${eventName} (${category}) telah penuh! (Maks: ${maxQuota})`);
      return;
    }

    // 2. Participation Rules Check
    const athleteRegs = registrations.filter(r => r.athleteName.toLowerCase() === athleteName.toLowerCase());
    
    // Max 1 team event
    const isRelay = eventName.includes('4x') || eventName === 'Tarik Tali';
    if (isRelay) {
      const athleteTeamRegs = athleteRegs.filter(r => r.eventName.includes('4x') || r.eventName === 'Tarik Tali');
      if (athleteTeamRegs.length >= 1) {
        alert(`${athleteName} sudah menyertai 1 acara berpasukan. Had maksima ialah 1.`);
        return;
      }
    } else {
      // Individual events: max 3
      const athleteIndivRegs = athleteRegs.filter(r => !r.eventName.includes('4x') && r.eventName !== 'Tarik Tali');
      if (athleteIndivRegs.length >= 3) {
        alert(`${athleteName} sudah menyertai 3 acara individu. Had maksima ialah 3.`);
        return;
      }

      // 2 balapan 1 padang OR 2 padang 1 balapan
      const balapanCount = athleteIndivRegs.filter(r => r.eventType === 'Balapan').length + (eventType === 'Balapan' ? 1 : 0);
      const padangCount = athleteIndivRegs.filter(r => r.eventType === 'Padang').length + (eventType === 'Padang' ? 1 : 0);

      if (balapanCount > 2 || padangCount > 2) {
        alert(`Syarat penyertaan: 2 Balapan 1 Padang ATAU 2 Padang 1 Balapan. ${athleteName} tidak boleh menambah acara ${eventType} lagi.`);
        return;
      }
    }

    const newReg: AthleteRegistration = {
      id: crypto.randomUUID(),
      ...regFormData
    };

    setRegistrations([...registrations, newReg]);
    setRegFormData({ ...regFormData, athleteName: '', kelas: KELAS_LIST[0] });
    alert('Pendaftaran atlet berjaya!');
  };

  const handleDeleteRegistration = (id: string) => {
    if (window.confirm('Adakah anda pasti ingin memadam pendaftaran ini?')) {
      setRegistrations(registrations.filter(r => r.id !== id));
    }
  };

  const groupedEvents = useMemo(() => {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [events]);

  const bestAthletes = useMemo(() => {
    const categories = ['L1', 'L2', 'P1', 'P2'];
    return categories.map(cat => {
      const catResults = results.filter(r => r.category === cat);
      const athleteStats: Record<string, { 
        name: string, 
        house: HouseName, 
        points: number, 
        gold: number, 
        silver: number, 
        bronze: number 
      }> = {};

      catResults.forEach(r => {
        if (!athleteStats[r.athleteName]) {
          athleteStats[r.athleteName] = { 
            name: r.athleteName, 
            house: r.house, 
            points: 0, 
            gold: 0, 
            silver: 0, 
            bronze: 0 
          };
        }
        athleteStats[r.athleteName].points += r.points;
        if (r.position === 1) athleteStats[r.athleteName].gold++;
        if (r.position === 2) athleteStats[r.athleteName].silver++;
        if (r.position === 3) athleteStats[r.athleteName].bronze++;
      });

      const sorted = Object.values(athleteStats).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.gold - a.gold;
      });

      return { category: cat, best: sorted[0] || null };
    });
  }, [results]);

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f8fafc'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('Laporan_Rasmi_Kejohanan_Sukan_SMK_Landas_2026.pdf');
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportStartingListPDF = async () => {
    if (!startingListRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(startingListRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Starting_List_${selectedStartingEvent}_${selectedStartingCategory}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const exportJudgesFormPDF = async () => {
    if (!judgesFormRef.current) return;
    setIsExporting(true);
    
    try {
      const canvas = await html2canvas(judgesFormRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Borang_Hakim_${selectedJudgesEvent}_${selectedJudgesCategory}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Gagal menjana PDF. Sila cuba lagi.');
    } finally {
      setIsExporting(false);
    }
  };

  const getEventType = (eventName: string) => {
    if (EVENTS_CONFIG.Balapan.some(e => e.name === eventName)) return 'Balapan';
    if (EVENTS_CONFIG.Padang.some(e => e.name === eventName)) return 'Padang';
    return 'Terbuka';
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-24 md:pb-8">
      {/* Header & Navigation Container */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <header className="px-4 py-4 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 border border-slate-100 shadow-sm">
                <img 
                  src="https://i.imgur.com/r6TqmA5.png" 
                  alt="Logo SMK Landas" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">SISTEM PENGURUSAN KEJOHANAN OLAHRAGA SEKOLAH</h1>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">SMK Landas 2026</p>
              </div>
            </div>
            
            <button 
              onClick={exportPDF}
              disabled={isExporting}
              className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-slate-800 transition-all shadow-md disabled:opacity-50"
            >
              {isExporting ? 'Menjana...' : <><Download size={18} /> Cetak Laporan</>}
            </button>
          </div>
        </header>

        {/* Horizontal Navigation Bar */}
        <nav className="border-t border-slate-100 overflow-x-auto scrollbar-hide">
          <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center gap-1 md:gap-2 py-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'calendar', label: 'Kalendar', icon: Calendar },
              { id: 'registration', label: 'Daftar Atlet', icon: UserPlus },
              { id: 'starting-list', label: 'Starting List', icon: ClipboardList },
              { id: 'judges-form', label: 'Borang Hakim', icon: Award },
              { id: 'input', label: 'Input Markah', icon: PlusCircle },
              { id: 'results', label: 'Rekod', icon: List },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <tab.icon size={18} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      <main className="max-w-7xl p-4 md:p-8 mx-auto">
        <AnimatePresence mode="wait">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
              ref={dashboardRef}
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-3xl font-extrabold text-slate-900">Papan Mata Utama</h2>
                  <p className="text-slate-500">Kedudukan terkini rumah sukan berdasarkan pungutan mata.</p>
                </div>
                <div className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-100 flex items-center gap-2 self-start">
                  <Calendar size={16} /> 2026
                </div>
              </div>

              {/* Leaderboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {houseStats.map((stat, index) => (
                  <div 
                    key={stat.name}
                    className={`relative overflow-hidden rounded-3xl p-6 shadow-xl transition-all hover:scale-[1.02] ${HOUSE_CONFIG[stat.name].light} border-2 ${HOUSE_CONFIG[stat.name].border}`}
                  >
                    <div className="absolute -right-4 -top-4 opacity-10">
                      <Trophy size={120} className={HOUSE_CONFIG[stat.name].text} />
                    </div>
                    
                    <div className="flex justify-between items-start mb-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${HOUSE_CONFIG[stat.name].color}`}>
                        <span className="text-xl font-bold">#{index + 1}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Jumlah Mata</p>
                        <p className={`text-4xl font-black ${HOUSE_CONFIG[stat.name].text}`}>{stat.totalPoints}</p>
                      </div>
                    </div>

                    <h3 className="text-2xl font-bold text-slate-800 mb-4">{stat.name}</h3>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="text-center">
                        <div className="bg-yellow-400/20 rounded-lg py-2">
                          <p className="text-xs font-bold text-yellow-700">Emas</p>
                          <p className="text-lg font-bold text-yellow-700">{stat.gold}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-slate-400/20 rounded-lg py-2">
                          <p className="text-xs font-bold text-slate-600">Perak</p>
                          <p className="text-lg font-bold text-slate-600">{stat.silver}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-orange-400/20 rounded-lg py-2">
                          <p className="text-xs font-bold text-orange-700">Gangsa</p>
                          <p className="text-lg font-bold text-orange-700">{stat.bronze}</p>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="bg-slate-200/50 rounded-lg py-2">
                          <p className="text-xs font-bold text-slate-500">Ke-4</p>
                          <p className="text-lg font-bold text-slate-500">{stat.fourth}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                    <Award size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Jumlah Acara Selesai</p>
                    <p className="text-2xl font-bold text-slate-900">{new Set(results.map(r => r.eventName)).size}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600">
                    <Users size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Jumlah Atlet Berjaya</p>
                    <p className="text-2xl font-bold text-slate-900">{results.length}</p>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                    <Medal size={32} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Rumah Mendahului</p>
                    <p className="text-2xl font-bold text-slate-900">{houseStats[0]?.name || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Best Athletes Section */}
              <div className="space-y-6 pt-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-100">
                    <Trophy size={20} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Anugerah Olahragawan/Olahragawati</h3>
                    <p className="text-slate-500">Atlet terbaik bagi setiap kategori berdasarkan pungutan mata.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {bestAthletes.map(({ category, best }) => (
                    <div key={category} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-all">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award size={80} />
                      </div>
                      
                      <div className="flex flex-col h-full">
                        <div className="mb-4">
                          <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                            Kategori {category}
                          </span>
                        </div>

                        {best ? (
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-lg font-bold text-slate-900 leading-tight mb-1">{best.name}</h4>
                              <p className={`text-sm font-bold ${HOUSE_CONFIG[best.house].text}`}>{best.house}</p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                              <div className="text-center">
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Mata</p>
                                <p className="text-lg font-black text-slate-900">{best.points}</p>
                              </div>
                              <div className="flex gap-2">
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-bold text-yellow-900 shadow-sm">
                                    {best.gold}
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400 mt-1">E</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-700 shadow-sm">
                                    {best.silver}
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400 mt-1">P</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <div className="w-6 h-6 bg-orange-300 rounded-full flex items-center justify-center text-[10px] font-bold text-orange-800 shadow-sm">
                                    {best.bronze}
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-400 mt-1">G</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center justify-center py-8">
                            <p className="text-sm text-slate-300 italic">Tiada data lagi</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Input Markah Tab */}
          {activeTab === 'input' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white">
                  <h2 className="text-2xl font-bold mb-2">Masukkan Keputusan</h2>
                  <p className="text-slate-400 text-sm">Sila isi borang di bawah untuk menambah markah rumah sukan.</p>
                </div>
                
                <form onSubmit={handleAddResult} className="p-8 space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      Nama Acara
                    </label>
                    <select 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                      value={formData.eventName}
                      onChange={e => setFormData({...formData, eventName: e.target.value})}
                      required
                    >
                      <option value="">Sila Pilih Acara</option>
                      {Array.from(new Set(Object.values(EVENTS_CONFIG).flat().map(ev => ev.name))).map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Kategori</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                        required
                      >
                        <option value="">Sila Pilih Kategori</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Kedudukan</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                        value={formData.position}
                        onChange={e => setFormData({...formData, position: parseInt(e.target.value) as 1|2|3|4})}
                        required
                      >
                        <option value="">Sila Pilih Kedudukan</option>
                        <option value={1}>🥇 Pertama (Emas)</option>
                        <option value={2}>🥈 Kedua (Perak)</option>
                        <option value={3}>🥉 Ketiga (Gangsa)</option>
                        <option value={4}>🏅 Keempat</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Rumah Sukan</label>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.values(HouseName).map(name => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setFormData({...formData, house: name})}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all font-bold ${
                            formData.house === name 
                              ? `${HOUSE_CONFIG[name].color} text-white border-transparent shadow-lg` 
                              : `bg-white border-slate-100 text-slate-600 hover:border-slate-200`
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Nama Atlet</label>
                    <input 
                      list="students-list"
                      type="text"
                      placeholder="Cari atau taip nama atlet"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      value={formData.athleteName}
                      onChange={e => setFormData({...formData, athleteName: e.target.value})}
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
                  >
                    <PlusCircle size={24} /> Simpan Keputusan
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Senarai Keputusan Tab */}
          {activeTab === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Senarai Keputusan Terkini</h2>
                  <p className="text-slate-500">Semua rekod kemenangan yang telah dimasukkan.</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600">
                  {results.length} Rekod
                </div>
              </div>

              {results.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Search size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Tiada Rekod Dijumpai</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Sila masukkan keputusan baru di tab 'Input Markah'.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {results.map((result) => (
                    <div 
                      key={result.id}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md ${HOUSE_CONFIG[result.house].color}`}>
                          {result.position === 1 ? '🥇' : result.position === 2 ? '🥈' : result.position === 3 ? '🥉' : '🏅'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{result.eventName} ({result.category})</h4>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span className={`font-bold ${HOUSE_CONFIG[result.house].text}`}>{result.house}</span>
                            <span className="text-slate-300">•</span>
                            <span>{result.athleteName}</span>
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Mata</p>
                          <p className="text-xl font-black text-slate-900">+{result.points}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteResult(result.id)}
                          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* Kalendar Acara Tab */}
          {activeTab === 'calendar' && (
            <motion.div 
              key="calendar"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Kalendar Acara</h2>
                  <p className="text-slate-500">Jadual acara sukan yang akan datang.</p>
                </div>
                <button 
                  onClick={() => {
                    const modal = document.getElementById('add-event-modal');
                    if (modal) modal.classList.remove('hidden');
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 self-start"
                >
                  <PlusCircle size={20} /> Tambah Acara
                </button>
              </div>

              {events.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <Calendar size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Tiada Acara Dijadualkan</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">Klik butang 'Tambah Acara' untuk mula mengisi jadual.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {groupedEvents.map(([date, dateEvents]) => (
                    <div key={date} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="h-px flex-1 bg-slate-200"></div>
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-4 py-1 rounded-full border border-slate-200">
                          {new Date(date).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <div className="h-px flex-1 bg-slate-200"></div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dateEvents.map(event => (
                          <div key={event.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all relative group">
                            <button 
                              onClick={() => handleDeleteEvent(event.id)}
                              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shrink-0">
                                <Calendar size={24} />
                              </div>
                              <div>
                                <h4 className="font-bold text-slate-900 mb-1">{event.title}</h4>
                                <div className="space-y-1">
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <Calendar size={12} /> {event.time || 'Masa tidak ditetapkan'}
                                  </p>
                                  <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                    <ChevronRight size={12} /> {event.location || 'Lokasi tidak ditetapkan'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Event Modal (Simple Overlay) */}
              <div id="add-event-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-up">
                  <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <h3 className="text-xl font-bold">Tambah Acara Baru</h3>
                    <button onClick={() => document.getElementById('add-event-modal')?.classList.add('hidden')} className="text-slate-400 hover:text-white">
                      <PlusCircle size={24} className="rotate-45" />
                    </button>
                  </div>
                  <form onSubmit={(e) => { handleAddEvent(e); document.getElementById('add-event-modal')?.classList.add('hidden'); }} className="p-6 space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Acara</label>
                      <select 
                        required
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={eventFormData.title}
                        onChange={e => setEventFormData({...eventFormData, title: e.target.value})}
                      >
                        <option value="">Sila Pilih Acara</option>
                        {Array.from(new Set(Object.values(EVENTS_CONFIG).flat().map(ev => ev.name))).map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tarikh</label>
                        <input 
                          type="date" 
                          required
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                          value={eventFormData.date}
                          onChange={e => setEventFormData({...eventFormData, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Masa</label>
                        <input 
                          type="time" 
                          className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                          value={eventFormData.time}
                          onChange={e => setEventFormData({...eventFormData, time: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Lokasi</label>
                      <select 
                        required
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        value={eventFormData.location}
                        onChange={e => setEventFormData({...eventFormData, location: e.target.value})}
                      >
                        <option value="">Sila Pilih Lokasi</option>
                        <option value="PADANG SMK LANDAS">PADANG SMK LANDAS</option>
                        <option value="DEWAN AL-FARABI, SMK LANDAS">DEWAN AL-FARABI, SMK LANDAS</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all mt-2">
                      Simpan Acara
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {/* Pendaftaran Atlet Tab */}
          {activeTab === 'registration' && (
            <motion.div 
              key="registration"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="bg-blue-600 p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-1 flex items-center gap-2">
                      <UserPlus size={28} /> Pendaftaran Atlet
                    </h2>
                    <p className="text-blue-100 text-sm">Daftar atlet mengikut kuota dan syarat penyertaan yang ditetapkan.</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider">
                    Syarat: 3 Individu (2+1) & 1 Berpasukan
                  </div>
                </div>

                <form onSubmit={handleAddRegistration} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Nama Atlet</label>
                      <input 
                        list="students-list"
                        type="text"
                        placeholder="Cari atau taip nama atlet"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={regFormData.athleteName}
                        onChange={e => setRegFormData({...regFormData, athleteName: e.target.value})}
                        required
                      />
                      <datalist id="students-list">
                        {STUDENTS_LIST.map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Kelas</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                        value={regFormData.kelas}
                        onChange={e => setRegFormData({...regFormData, kelas: e.target.value})}
                        required
                      >
                        <option value="">Sila Pilih Kelas</option>
                        {KELAS_LIST.map(k => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Rumah Sukan</label>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.values(HouseName).map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setRegFormData({...regFormData, house: name})}
                            className={`py-2 rounded-xl border-2 font-bold text-sm transition-all ${
                              regFormData.house === name 
                                ? `${HOUSE_CONFIG[name].color} text-white border-transparent shadow-md` 
                                : `bg-white border-slate-100 text-slate-600 hover:border-slate-200`
                            }`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Jenis Acara</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                          value={regFormData.eventType}
                          onChange={e => {
                            const type = e.target.value as 'Balapan' | 'Padang' | 'Terbuka';
                            setRegFormData({
                              ...regFormData, 
                              eventType: type,
                              eventName: '',
                              category: ''
                            });
                          }}
                          required
                        >
                          <option value="">Sila Pilih Jenis Acara</option>
                          <option value="Balapan">Balapan</option>
                          <option value="Padang">Padang</option>
                          <option value="Terbuka">Terbuka</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">Status</label>
                        <select 
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                          value={regFormData.type}
                          onChange={e => setRegFormData({...regFormData, type: e.target.value as 'Utama' | 'Simpanan'})}
                          required
                        >
                          <option value="">Sila Pilih Status</option>
                          <option value="Utama">Atlet Utama</option>
                          <option value="Simpanan">Atlet Simpanan</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Pilih Acara</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                        value={regFormData.eventName}
                        onChange={e => setRegFormData({...regFormData, eventName: e.target.value})}
                        required
                      >
                        <option value="">Sila Pilih Acara</option>
                        {regFormData.eventType && (EVENTS_CONFIG[regFormData.eventType as keyof typeof EVENTS_CONFIG] || []).map(ev => (
                          <option key={ev.name} value={ev.name}>{ev.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Kategori</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                        value={regFormData.category}
                        onChange={e => setRegFormData({...regFormData, category: e.target.value})}
                        required
                      >
                        <option value="">Sila Pilih Kategori</option>
                        {regFormData.eventType && (
                          regFormData.eventType === 'Terbuka' ? (
                            <option value="Terbuka">Terbuka (Semua Umur)</option>
                          ) : (
                            Object.entries(CATEGORY_MAP).filter(([k]) => k !== 'Terbuka').map(([key, label]) => (
                              <option key={key} value={key}>{key} - {label}</option>
                            ))
                          )
                        )}
                      </select>
                    </div>

                    <div className="pt-4">
                      <button 
                        type="submit"
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 size={24} /> Daftar Atlet
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Registration List */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <List size={24} /> Senarai Pendaftaran
                </h3>
                
                {registrations.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-slate-300">
                    <p className="text-slate-500">Tiada atlet didaftarkan lagi.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registrations.map(reg => (
                      <div key={reg.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-start group">
                        <div className="flex gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${HOUSE_CONFIG[reg.house].color}`}>
                            {reg.house.substring(0, 1)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{reg.athleteName}</h4>
                            <p className="text-[10px] text-blue-600 font-bold uppercase">{reg.kelas}</p>
                            <p className="text-xs text-slate-500">{reg.eventName} ({reg.category})</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${reg.type === 'Utama' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {reg.type}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteRegistration(reg.id)}
                          className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Starting List Tab */}
          {activeTab === 'starting-list' && (
            <motion.div 
              key="starting-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Starting List (Penyelia Peserta)</h2>
                  <p className="text-slate-500">Senarai atlet mengikut acara untuk tujuan penyeliaan.</p>
                </div>
                <button 
                  onClick={exportStartingListPDF}
                  disabled={isExporting || registrations.length === 0}
                  className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 self-start disabled:opacity-50"
                >
                  <Printer size={20} /> {isExporting ? 'Menjana...' : 'Cetak Starting List'}
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pilih Acara</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                    value={selectedStartingEvent}
                    onChange={e => setSelectedStartingEvent(e.target.value)}
                  >
                    <option value="">Sila Pilih Acara</option>
                    {Array.from(new Set(Object.values(EVENTS_CONFIG).flat().map(ev => ev.name))).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pilih Kategori</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                    value={selectedStartingCategory}
                    onChange={e => setSelectedStartingCategory(e.target.value)}
                  >
                    <option value="">Sila Pilih Kategori</option>
                    {Object.keys(CATEGORY_MAP).map(cat => (
                      <option key={cat} value={cat}>{cat} - {CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Pratinjau Cetakan</h3>
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                  <div ref={startingListRef} className="p-12 bg-white min-h-[600px]">
                    <div className="text-center mb-10 border-b-2 border-slate-900 pb-6">
                      <img 
                        src="https://i.imgur.com/r6TqmA5.png" 
                        alt="Logo" 
                        className="w-20 h-20 mx-auto mb-4 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <h1 className="text-2xl font-black uppercase">SMK LANDAS 2026</h1>
                      <h2 className="text-xl font-bold uppercase">BORANG PENYELIAAN PESERTA (STARTING LIST)</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase">Acara</p>
                        <p className="text-lg font-black">{selectedStartingEvent}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase">Kategori</p>
                        <p className="text-lg font-black">{selectedStartingCategory} ({CATEGORY_MAP[selectedStartingCategory as keyof typeof CATEGORY_MAP]})</p>
                      </div>
                    </div>

                    <table className="w-full border-collapse border-2 border-slate-900">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border-2 border-slate-900 p-3 text-sm font-black uppercase w-16">No</th>
                          <th className="border-2 border-slate-900 p-3 text-sm font-black uppercase text-left">Nama Atlet</th>
                          <th className="border-2 border-slate-900 p-3 text-sm font-black uppercase w-24">Kelas</th>
                          <th className="border-2 border-slate-900 p-3 text-sm font-black uppercase w-32">Rumah</th>
                          <th className="border-2 border-slate-900 p-3 text-sm font-black uppercase w-32">Status</th>
                          <th className="border-2 border-slate-900 p-3 text-sm font-black uppercase w-24">Hadir</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations
                          .filter(r => r.eventName === selectedStartingEvent && r.category === selectedStartingCategory)
                          .sort((a, b) => a.type === 'Utama' ? -1 : 1)
                          .map((reg, index) => (
                            <tr key={reg.id}>
                              <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                              <td className="border-2 border-slate-900 p-3 font-bold uppercase">{reg.athleteName}</td>
                              <td className="border-2 border-slate-900 p-3 text-center font-bold text-xs">{reg.kelas}</td>
                              <td className="border-2 border-slate-900 p-3 text-center font-bold">{reg.house}</td>
                              <td className="border-2 border-slate-900 p-3 text-center text-xs font-black uppercase">{reg.type}</td>
                              <td className="border-2 border-slate-900 p-3"></td>
                            </tr>
                          ))}
                        {registrations.filter(r => r.eventName === selectedStartingEvent && r.category === selectedStartingCategory).length === 0 && (
                          <tr>
                            <td colSpan={6} className="border-2 border-slate-900 p-10 text-center italic text-slate-400">
                              Tiada atlet didaftarkan untuk acara dan kategori ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="mt-16 grid grid-cols-2 gap-20">
                      <div className="border-t border-slate-900 pt-2 text-center">
                        <p className="text-xs font-bold uppercase">Tandatangan Penyelia</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2 text-center">
                        <p className="text-xs font-bold uppercase">Tarikh & Masa</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Borang Hakim Tab */}
          {activeTab === 'judges-form' && (
            <motion.div 
              key="judges-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Borang Hakim</h2>
                  <p className="text-slate-500">Penjanaan borang keputusan untuk kegunaan hakim pertandingan.</p>
                </div>
                <button 
                  onClick={exportJudgesFormPDF}
                  disabled={isExporting || registrations.length === 0}
                  className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-slate-800 transition-all flex items-center gap-2 self-start disabled:opacity-50"
                >
                  <Printer size={20} /> {isExporting ? 'Menjana...' : 'Cetak Borang Hakim'}
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pilih Acara</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                    value={selectedJudgesEvent}
                    onChange={e => setSelectedJudgesEvent(e.target.value)}
                  >
                    <option value="">Sila Pilih Acara</option>
                    {Array.from(new Set(Object.values(EVENTS_CONFIG).flat().map(ev => ev.name))).map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Pilih Kategori</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white"
                    value={selectedJudgesCategory}
                    onChange={e => setSelectedJudgesCategory(e.target.value)}
                  >
                    <option value="">Sila Pilih Kategori</option>
                    {Object.keys(CATEGORY_MAP).map(cat => (
                      <option key={cat} value={cat}>{cat} - {CATEGORY_MAP[cat as keyof typeof CATEGORY_MAP]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preview Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Pratinjau Borang Hakim</h3>
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                  <div ref={judgesFormRef} className="p-12 bg-white min-h-[600px]">
                    <div className="text-center mb-10 border-b-2 border-slate-900 pb-6">
                      <img 
                        src="https://i.imgur.com/r6TqmA5.png" 
                        alt="Logo" 
                        className="w-20 h-20 mx-auto mb-4 object-contain"
                        referrerPolicy="no-referrer"
                      />
                      <h1 className="text-2xl font-black uppercase">SMK LANDAS 2026</h1>
                      <h2 className="text-xl font-bold uppercase">BORANG KEPUTUSAN RASMI (HAKIM)</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase">Acara</p>
                        <p className="text-lg font-black">{selectedJudgesEvent} ({getEventType(selectedJudgesEvent)})</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase">Kategori</p>
                        <p className="text-lg font-black">{selectedJudgesCategory} ({CATEGORY_MAP[selectedJudgesCategory as keyof typeof CATEGORY_MAP]})</p>
                      </div>
                    </div>

                    <table className="w-full border-collapse border-2 border-slate-900">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-12">No</th>
                          <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase text-left">Nama Atlet</th>
                          <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-20">Kelas</th>
                          <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-24">Rumah</th>
                          
                          {getEventType(selectedJudgesEvent) === 'Balapan' ? (
                            <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-32">Catatan Masa</th>
                          ) : getEventType(selectedJudgesEvent) === 'Padang' ? (
                            <>
                              <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-16">P1</th>
                              <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-16">P2</th>
                              <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-16">P3</th>
                              <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-24">Terbaik</th>
                            </>
                          ) : (
                            <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-32">Keputusan</th>
                          )}
                          
                          <th className="border-2 border-slate-900 p-3 text-xs font-black uppercase w-24">Kedudukan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {registrations
                          .filter(r => r.eventName === selectedJudgesEvent && r.category === selectedJudgesCategory && r.type === 'Utama')
                          .map((reg, index) => (
                            <tr key={reg.id}>
                              <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                              <td className="border-2 border-slate-900 p-3 font-bold uppercase text-sm">{reg.athleteName}</td>
                              <td className="border-2 border-slate-900 p-3 text-center font-bold text-[10px]">{reg.kelas}</td>
                              <td className="border-2 border-slate-900 p-3 text-center font-bold text-sm">{reg.house}</td>
                              
                              {getEventType(selectedJudgesEvent) === 'Balapan' ? (
                                <td className="border-2 border-slate-900 p-3"></td>
                              ) : getEventType(selectedJudgesEvent) === 'Padang' ? (
                                <>
                                  <td className="border-2 border-slate-900 p-3"></td>
                                  <td className="border-2 border-slate-900 p-3"></td>
                                  <td className="border-2 border-slate-900 p-3"></td>
                                  <td className="border-2 border-slate-900 p-3"></td>
                                </>
                              ) : (
                                <td className="border-2 border-slate-900 p-3"></td>
                              )}
                              
                              <td className="border-2 border-slate-900 p-3"></td>
                            </tr>
                          ))}
                        {registrations.filter(r => r.eventName === selectedJudgesEvent && r.category === selectedJudgesCategory && r.type === 'Utama').length === 0 && (
                          <tr>
                            <td colSpan={getEventType(selectedJudgesEvent) === 'Padang' ? 9 : 6} className="border-2 border-slate-900 p-10 text-center italic text-slate-400">
                              Tiada atlet utama didaftarkan untuk acara ini.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="mt-16 grid grid-cols-3 gap-10">
                      <div className="border-t border-slate-900 pt-2 text-center">
                        <p className="text-[10px] font-bold uppercase">Tandatangan Hakim 1</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2 text-center">
                        <p className="text-[10px] font-bold uppercase">Tandatangan Hakim 2</p>
                      </div>
                      <div className="border-t border-slate-900 pt-2 text-center">
                        <p className="text-[10px] font-bold uppercase">Ketua Hakim / Referi</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Floating Action Button for PDF on Mobile */}
      <button 
        onClick={exportPDF}
        disabled={isExporting}
        className="md:hidden fixed bottom-8 right-6 w-14 h-14 bg-slate-900 text-white rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-95 transition-all disabled:opacity-50"
      >
        {isExporting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download size={24} />}
      </button>
    </div>
  );
};

export default App;
