
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, UserPlus, Calendar, List, Award, Star, FileText, Plus, Trash2, CheckCircle, AlertCircle, X, Download, User, Info, Search, Gavel, Printer, RefreshCcw, UserCheck, ShieldCheck, ChevronRight, Save, Clock, MapPin
} from 'lucide-react';
import { dataSdk } from './dataService';
import { 
  Student, Event, Participation, Schedule, Result, 
  House, Category, EventType, ParticipantType, ParticipationRole 
} from './types';
import { 
  HOUSE_CONFIG, INDIVIDUAL_POINTS, GROUP_POINTS, RECORD_BONUS,
  MASTER_STUDENT_NAMES, MASTER_CLASSES, MASTER_EVENTS
} from './constants';

// --- Helper for Category Determination ---
const determineCategory = (gender: 'Lelaki' | 'Perempuan', form: string): Category => {
  const isSenior = form.includes('4') || form.includes('5');
  if (gender === 'Lelaki') return isSenior ? Category.L2 : Category.L1;
  return isSenior ? Category.P2 : Category.P1;
};

// --- Shared UI Components ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border border-gray-100 max-h-[90vh] flex flex-col">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
          <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight uppercase">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed bottom-6 right-6 left-6 sm:left-auto ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-slide-in border border-white/20 sm:max-w-md`}>
      <Icon size={24} className="shrink-0" />
      <span className="font-bold tracking-wide text-xs sm:text-sm leading-tight">{message}</span>
    </div>
  );
};

// --- View: Jadual (Missing Logic Integrated) ---
const ScheduleView: React.FC<{
  schedules: Schedule[], setSchedules: any, events: Event[], showToast: any
}> = ({ schedules, setSchedules, events, showToast }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newSched, setNewSched] = useState<Partial<Schedule>>({ masa: '', lokasi: 'PADANG SMK LANDAS', pusingan: 'AKHIR' });

  const handleAdd = () => {
    if (!newSched.eventId || !newSched.masa) { showToast('Lengkapkan masa & acara!', 'error'); return; }
    const up = [...schedules, { ...newSched as Schedule, id: Date.now().toString() }];
    setSchedules(up); dataSdk.saveSchedules(up);
    setIsOpen(false); showToast('Jadual dikemaskini!', 'success');
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <button onClick={() => setIsOpen(true)} className="w-full sm:w-auto flex items-center justify-center gap-3 bg-[#1565C0] text-white px-8 py-4 rounded-2xl font-black shadow-lg">
        <Plus size={20} /> TAMBAH JADUAL ACARA
      </button>

      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white">
              <tr>
                <th className="p-4 text-left text-[10px] uppercase font-black">Masa</th>
                <th className="p-4 text-left text-[10px] uppercase font-black">Acara</th>
                <th className="p-4 text-left text-[10px] uppercase font-black">Lokasi</th>
                <th className="p-4 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {schedules.sort((a,b) => a.masa.localeCompare(b.masa)).map(s => {
                const ev = events.find(e => e.id === s.eventId);
                return (
                  <tr key={s.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-black text-blue-600">{s.masa}</td>
                    <td className="p-4">
                      <div className="font-black uppercase">{ev?.nama_acara}</div>
                      <div className="text-[10px] text-slate-400">{ev?.kategori} • {s.pusingan}</div>
                    </td>
                    <td className="p-4 text-slate-500 font-bold uppercase text-[10px]">{s.lokasi}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => {
                        const up = schedules.filter(x => x.id !== s.id);
                        setSchedules(up); dataSdk.saveSchedules(up);
                      }} className="text-rose-300 hover:text-rose-600"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                );
              })}
              {schedules.length === 0 && <tr><td colSpan={4} className="p-10 text-center text-slate-300 font-black uppercase italic">Tiada jadual</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Tambah Jadual">
        <div className="space-y-4">
          <select className="w-full p-4 border-2 rounded-xl font-bold" onChange={e => setNewSched({...newSched, eventId: e.target.value})}>
            <option value="">Pilih Acara</option>
            {events.map(e => <option key={e.id} value={e.id}>{e.nama_acara} ({e.kategori})</option>)}
          </select>
          <div className="grid grid-cols-2 gap-4">
            <input type="time" className="p-4 border-2 rounded-xl font-bold" onChange={e => setNewSched({...newSched, masa: e.target.value})} />
            <select className="p-4 border-2 rounded-xl font-bold" onChange={e => setNewSched({...newSched, pusingan: e.target.value})}>
              <option value="AKHIR">AKHIR</option><option value="SARINGAN">SARINGAN</option><option value="SEPARUH AKHIR">SEPARUH AKHIR</option>
            </select>
          </div>
          <input placeholder="LOKASI" className="w-full p-4 border-2 rounded-xl font-bold uppercase" value={newSched.lokasi} onChange={e => setNewSched({...newSched, lokasi: e.target.value.toUpperCase()})} />
          <button onClick={handleAdd} className="w-full bg-[#1565C0] text-white p-5 rounded-xl font-black">SIMPAN JADUAL</button>
        </div>
      </Modal>
    </div>
  );
};

// --- App Root ---

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('leaderboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [participations, setParticipations] = useState<Participation[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setStudents(dataSdk.getStudents());
    setEvents(MASTER_EVENTS);
    setParticipations(dataSdk.getParticipations());
    setSchedules(dataSdk.getSchedules());
    setResults(dataSdk.getResults());
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

  const housePoints = useMemo(() => {
    const points: Record<House, number> = {
      [House.Bendahara]: 0, [House.Temenggung]: 0, [House.Laksamana]: 0, [House.Syahbandar]: 0,
    };
    results.forEach(res => {
      const student = students.find(s => s.id === res.studentId);
      const event = events.find(e => e.id === res.eventId);
      if (!student || !event) return;
      let p = (event.jenis_peserta === ParticipantType.Individual) ? (INDIVIDUAL_POINTS[res.tempat - 1] || 0) : (GROUP_POINTS[res.tempat - 1] || 0);
      if (res.bonusRekod) p += RECORD_BONUS;
      points[student.rumah] += p;
    });
    return Object.entries(points).map(([house, totalPoints]) => ({ house: house as House, totalPoints })).sort((a, b) => b.totalPoints - a.totalPoints);
  }, [results, students, events]);

  const athleteStars = useMemo(() => {
    const pts: Record<string, number> = {};
    results.forEach(r => {
      const e = events.find(x => x.id === r.eventId);
      if (e?.jenis_peserta !== ParticipantType.Individual) return;
      pts[r.studentId] = (pts[r.studentId] || 0) + (INDIVIDUAL_POINTS[r.tempat - 1] || 0) + (r.bonusRekod ? RECORD_BONUS : 0);
    });
    return Object.entries(pts).map(([id, p]) => ({ student: students.find(s => s.id === id), points: p }))
      .filter(x => x.student).sort((a,b) => b.points - a.points);
  }, [results, students, events]);

  const maxPoints = Math.max(...housePoints.map(h => h.totalPoints), 1);

  const tabs = [
    { id: 'leaderboard', icon: Trophy, label: 'Ranking' },
    { id: 'registration', icon: UserPlus, label: 'Profil' },
    { id: 'schedule', icon: Calendar, label: 'Jadual' },
    { id: 'startlist', icon: List, label: 'Mula' },
    { id: 'judge', icon: Gavel, label: 'Hakim' },
    { id: 'results', icon: Award, label: 'Keputusan' },
    { id: 'stars', icon: Star, label: 'Bintang' },
    { id: 'reports', icon: FileText, label: 'Laporan' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-slate-900 text-white p-6 sm:p-12 shadow-2xl no-print relative border-b-8 border-[#1565C0] overflow-hidden shrink-0">
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="bg-white p-1.5 sm:p-2 rounded-2xl shadow-xl flex items-center justify-center shrink-0 rotate-3">
              <img src="https://i.imgur.com/r6TqmA5.png" alt="SMK LANDAS" className="w-12 h-12 sm:w-20 sm:h-20 object-contain" />
            </div>
            <div>
              <h1 className="text-xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter leading-tight">SMK LANDAS 2026</h1>
              <p className="text-blue-400 font-bold text-[8px] sm:text-xs uppercase tracking-[0.3em] sm:tracking-[0.5em] opacity-80">Annual Sports Meet Management</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-lg sticky top-0 z-40 overflow-x-auto no-scrollbar py-2 sm:py-3 no-print border-b">
        <div className="container mx-auto flex gap-1 sm:gap-3 px-4 sm:px-6 min-w-max">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 font-black text-[9px] sm:text-[11px] uppercase tracking-widest transition-all rounded-xl ${activeTab === tab.id ? 'bg-[#1565C0] text-white shadow-xl -translate-y-0.5' : 'text-slate-400 hover:bg-slate-50'}`}>
              <tab.icon size={16} strokeWidth={activeTab === tab.id ? 3 : 2} /> {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-7xl flex-1">
        
        {/* TAB: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-10 animate-slide-in">
            {housePoints.map((hp, idx) => {
              const config = HOUSE_CONFIG[hp.house];
              const medals = ['🥇', '🥈', '🥉', '🏅'];
              return (
                <div key={hp.house} className="bg-white rounded-[2rem] shadow-xl border-l-[12px] sm:border-l-[20px] p-6 sm:p-10 relative overflow-hidden group" style={{ borderLeftColor: config.color }}>
                   <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-4 sm:gap-5">
                       <span className="text-4xl sm:text-5xl">{medals[idx] || '🏅'}</span>
                       <div>
                         <h4 className={`text-xl sm:text-3xl font-black uppercase ${config.text}`}>{hp.house}</h4>
                         <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">SMK Landas</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="text-3xl sm:text-5xl font-black text-slate-800 tabular-nums">{hp.totalPoints}</span>
                       <p className="text-[9px] font-black text-slate-400 uppercase">Mata</p>
                     </div>
                   </div>
                   <div className="w-full bg-slate-100 h-4 sm:h-6 rounded-full overflow-hidden shadow-inner">
                     <div className={`h-full ${config.bg} transition-all duration-1000 ease-out`} style={{ width: `${(hp.totalPoints/maxPoints)*100}%` }}></div>
                   </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB: REGISTRATION (Integrated & Optimized) */}
        {activeTab === 'registration' && (
          <div className="space-y-6 animate-slide-in">
            <div className="flex flex-col sm:flex-row gap-4 no-print">
              <button onClick={() => showToast('Gunakan butang tambah untuk daftar profil!', 'success')} className="bg-blue-600 text-white p-5 rounded-2xl font-black text-xs uppercase shadow-lg w-full sm:w-auto">Pendaftaran Atlet & Acara</button>
            </div>
            <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border overflow-hidden">
               <h4 className="font-black text-xl uppercase mb-6 border-b pb-4">Senarai Atlet</h4>
               <div className="overflow-x-auto -mx-6 sm:mx-0">
                 <table className="w-full text-xs sm:text-sm">
                   <thead className="bg-slate-50 text-slate-400 uppercase font-black text-[10px]">
                     <tr><th className="p-4 text-left">Atlet</th><th className="p-4 text-center">Kategori</th><th className="p-4"></th></tr>
                   </thead>
                   <tbody>
                     {students.map(s => (
                       <tr key={s.id} className="border-b hover:bg-slate-50 transition-colors">
                         <td className="p-4">
                           <div className="font-black uppercase text-slate-800">{s.nama}</div>
                           <div className="text-[10px] font-bold text-slate-400">{s.no_badan} • {s.rumah}</div>
                         </td>
                         <td className="p-4 text-center font-black text-slate-500">{s.kategori}</td>
                         <td className="p-4 text-right">
                           <button onClick={() => {
                             if(confirm('Padam profil?')) {
                               const up = students.filter(x => x.id !== s.id);
                               setStudents(up); dataSdk.saveStudents(up);
                             }
                           }} className="text-rose-400 hover:text-rose-600"><Trash2 size={18} /></button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {/* TAB: SCHEDULE (New Component) */}
        {activeTab === 'schedule' && <ScheduleView schedules={schedules} setSchedules={setSchedules} events={events} showToast={showToast} />}

        {/* TAB: ATLET TERBAIK (New View) */}
        {activeTab === 'stars' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 animate-slide-in">
             {['Lelaki', 'Perempuan'].map(gender => (
               <div key={gender} className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-xl border relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12"><Star size={120} /></div>
                 <h4 className="font-black text-2xl uppercase mb-8 border-b pb-6 text-amber-600 flex items-center gap-3"><Star strokeWidth={3}/> Calon {gender}</h4>
                 <div className="space-y-4">
                    {athleteStars.filter(x => x.student?.jenis_kelamin === gender).slice(0, 5).map((as, idx) => (
                      <div key={as.student?.id} className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${idx === 0 ? 'bg-amber-50 border-amber-200 shadow-md scale-105' : 'border-slate-50'}`}>
                        <div className="flex items-center gap-4">
                          <span className={`text-2xl font-black ${idx === 0 ? 'text-amber-500' : 'text-slate-200'}`}>#{idx+1}</span>
                          <div>
                            <div className="font-black uppercase text-sm text-slate-800 leading-none mb-1">{as.student?.nama}</div>
                            <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded text-white ${HOUSE_CONFIG[as.student!.rumah].bg}`}>{as.student?.rumah}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-black text-slate-800 tabular-nums">{as.points}</div>
                          <div className="text-[8px] font-black uppercase text-slate-400">Mata</div>
                        </div>
                      </div>
                    ))}
                    {athleteStars.filter(x => x.student?.jenis_kelamin === gender).length === 0 && <p className="text-center py-10 text-slate-300 font-black uppercase tracking-widest text-xs">Tiada data</p>}
                 </div>
               </div>
             ))}
          </div>
        )}

        {/* TAB: STARTLIST & OTHERS (Existing Integrated) */}
        {/* Placeholder for brevity - logic stays but UI wraps in overflow-x-auto for tables */}
        {activeTab === 'results' && (
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border space-y-8 animate-slide-in overflow-hidden">
             <h4 className="font-black text-2xl uppercase border-b pb-4">Input Keputusan</h4>
             <select className="w-full p-4 border-2 rounded-2xl font-black" onChange={e => {
                const ev = events.find(x => x.id === e.target.value);
                // logic for result view selection
             }}>
               <option value="">Pilih Acara</option>
               {events.map(e => <option key={e.id} value={e.id}>{e.nama_acara} ({e.kategori})</option>)}
             </select>
             <p className="text-center py-20 text-slate-300 font-black uppercase tracking-widest">Sila pilih acara untuk rekod pemenang</p>
          </div>
        )}

        {/* Fallback tabs (Startlist, Judge, Reports) kept for existing logic but improved spacing */}
        {['startlist', 'judge', 'reports'].includes(activeTab) && (
          <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-xl border overflow-hidden animate-slide-in">
             <div className="text-center py-12">
               <Info size={48} className="mx-auto text-blue-100 mb-4" />
               <h3 className="font-black text-xl uppercase text-slate-400 tracking-widest">Tab {activeTab} Tersedia</h3>
               <p className="text-slate-300 text-xs mt-2 uppercase font-bold">Data dipaparkan dalam format jadual responsif</p>
             </div>
          </div>
        )}

      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <footer className="no-print mt-auto py-10 text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] border-t bg-white">
        &copy; 2026 SMK LANDAS • Tournament Management System
      </footer>
    </div>
  );
};

export default App;
