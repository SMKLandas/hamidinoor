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

// --- Main App Component ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'input' | 'results' | 'calendar' | 'registration' | 'starting-list' | 'judges-form'>('dashboard');
  const [results, setResults] = useState<ResultEntry[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [registrations, setRegistrations] = useState<AthleteRegistration[]>([]);
  
  const [selectedStartingEvent, setSelectedStartingEvent] = useState('100M');
  const [selectedStartingCategory, setSelectedStartingCategory] = useState('L1');

  const [selectedJudgesEvent, setSelectedJudgesEvent] = useState('100M');
  const [selectedJudgesCategory, setSelectedJudgesCategory] = useState('L1');

  const [formData, setFormData] = useState({
    eventName: '100M',
    category: 'L1',
    house: HouseName.TEMENGGUNG,
    position: 1 as 1 | 2 | 3 | 4,
    athleteName: ''
  });

  const [regFormData, setRegFormData] = useState({
    athleteName: '',
    house: HouseName.TEMENGGUNG,
    eventType: 'Balapan' as 'Balapan' | 'Padang' | 'Terbuka',
    eventName: '100M',
    category: 'L1',
    type: 'Utama' as 'Utama' | 'Simpanan'
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
    if (!formData.eventName || !formData.athleteName) {
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
      position: 1
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
    if (!eventFormData.title || !eventFormData.date) {
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
    const { athleteName, house, eventName, category, type, eventType } = regFormData;

    if (!athleteName) {
      alert('Sila masukkan nama atlet!');
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
    setRegFormData({ ...regFormData, athleteName: '' });
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
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-700">Kedudukan</label>
                      <select 
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none bg-white"
                        value={formData.position}
                        onChange={e => setFormData({...formData, position: parseInt(e.target.value) as 1|2|3|4})}
                      >
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
                      type="text"
                      placeholder="Masukkan nama penuh atlet"
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
                      <input 
                        type="text" 
                        required
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        value={eventFormData.title}
                        onChange={e => setEventFormData({...eventFormData, title: e.target.value})}
                      />
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
                      <input 
                        type="text" 
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
                        value={eventFormData.location}
                        onChange={e => setEventFormData({...eventFormData, location: e.target.value})}
                      />
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
                        type="text"
                        placeholder="Masukkan nama penuh atlet"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        value={regFormData.athleteName}
                        onChange={e => setRegFormData({...regFormData, athleteName: e.target.value})}
                        required
                      />
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
                              eventName: EVENTS_CONFIG[type][0].name,
                              category: type === 'Terbuka' ? 'Terbuka' : 'L1'
                            });
                          }}
                        >
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
                        >
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
                      >
                        {EVENTS_CONFIG[regFormData.eventType].map(ev => (
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
                      >
                        {regFormData.eventType === 'Terbuka' ? (
                          <option value="Terbuka">Terbuka (Semua Umur)</option>
                        ) : (
                          Object.entries(CATEGORY_MAP).filter(([k]) => k !== 'Terbuka').map(([key, label]) => (
                            <option key={key} value={key}>{key} - {label}</option>
                          ))
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
                              <td className="border-2 border-slate-900 p-3 text-center font-bold">{reg.house}</td>
                              <td className="border-2 border-slate-900 p-3 text-center text-xs font-black uppercase">{reg.type}</td>
                              <td className="border-2 border-slate-900 p-3"></td>
                            </tr>
                          ))}
                        {registrations.filter(r => r.eventName === selectedStartingEvent && r.category === selectedStartingCategory).length === 0 && (
                          <tr>
                            <td colSpan={5} className="border-2 border-slate-900 p-10 text-center italic text-slate-400">
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
                            <td colSpan={getEventType(selectedJudgesEvent) === 'Padang' ? 8 : 5} className="border-2 border-slate-900 p-10 text-center italic text-slate-400">
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
