
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Trophy, UserPlus, Calendar, List, Award, Star, FileText, Plus, Trash2, CheckCircle, AlertCircle, X, Download, User, Info, Search, Gavel, Printer, RefreshCcw, UserCheck, ShieldCheck, ChevronRight, Save
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-scale-up border border-gray-100">
        <div className="p-5 border-b flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-gray-100 rounded-lg">
            <X size={24} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'success' ? 'bg-emerald-600' : 'bg-rose-600';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed bottom-6 right-6 ${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 z-50 animate-slide-in border border-white/20 max-w-md`}>
      <Icon size={24} className="shrink-0" />
      <span className="font-bold tracking-wide text-sm leading-tight">{message}</span>
    </div>
  );
};

// --- Main Views ---

const RegistrationView: React.FC<{
  students: Student[], setStudents: any, 
  events: Event[],
  participations: Participation[], setParticipations: any,
  deleteStudent: any,
  showToast: any
}> = ({ students, setStudents, events, participations, setParticipations, deleteStudent, showToast }) => {
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false);
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);

  const [newStudent, setNewStudent] = useState<Partial<Student>>({ 
    nama: '', 
    tingkatan: MASTER_CLASSES[0], 
    rumah: House.Bendahara, 
    jenis_kelamin: 'Lelaki' 
  });
  
  const [enrollment, setEnrollment] = useState({ studentId: '', eventId: '', role: ParticipationRole.Main });

  const handleAddStudent = () => {
    if (!newStudent.no_badan || !newStudent.nama || !newStudent.tingkatan || !newStudent.jenis_kelamin) {
      showToast('Sila lengkapkan semua maklumat!', 'error'); return;
    }
    const category = determineCategory(newStudent.jenis_kelamin as any, newStudent.tingkatan as any);
    const student: Student = { ...newStudent as Student, kategori: category, id: Date.now().toString() };
    const updated = [...students, student];
    setStudents(updated);
    dataSdk.saveStudents(updated);
    setIsAddStudentOpen(false);
    showToast(`Atlet ${student.nama} berjaya didaftarkan!`, 'success');
  };

  const handleEnroll = () => {
    if (!enrollment.studentId || !enrollment.eventId) {
      showToast('Pilih atlet dan acara!', 'error'); return;
    }
    
    const student = students.find(s => s.id === enrollment.studentId)!;
    const event = events.find(e => e.id === enrollment.eventId)!;

    if (event.kategori !== Category.Terbuka && student.kategori !== event.kategori) {
      showToast(`Ralat Kategori! Atlet ${student.kategori} vs Acara ${event.kategori}.`, 'error'); return;
    }

    if (participations.some(p => p.studentId === enrollment.studentId && p.eventId === enrollment.eventId)) {
        showToast('Atlet sudah berdaftar dalam acara ini!', 'error'); return;
    }

    const myParts = participations.filter(p => p.studentId === student.id);
    const myEvents = myParts.map(p => events.find(e => e.id === p.eventId)!);
    
    if (event.jenis_peserta === ParticipantType.Individual) {
      const indCount = myEvents.filter(e => e.jenis_peserta === ParticipantType.Individual).length;
      if (indCount >= 3) { showToast('Had 3 acara individu dicapai!', 'error'); return; }
    } else {
      const groupCount = myEvents.filter(e => e.jenis_peserta === ParticipantType.Group).length;
      if (groupCount >= 1) { showToast('Had 1 acara berpasukan sahaja!', 'error'); return; }
    }

    const p: Participation = { id: Date.now().toString(), ...enrollment };
    const updated = [...participations, p];
    setParticipations(updated);
    dataSdk.saveParticipations(updated);
    setIsEnrollOpen(false);
    showToast('Penyertaan berjaya direkod!', 'success');
  };

  const deleteParticipation = (id: string) => {
    if (confirm('Padam pendaftaran acara untuk atlet ini?')) {
        const updated = participations.filter(p => p.id !== id);
        setParticipations(updated);
        dataSdk.saveParticipations(updated);
        showToast('Penyertaan telah dipadam.', 'success');
    }
  };

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex flex-wrap gap-4 no-print">
        <button onClick={() => setIsAddStudentOpen(true)} className="flex items-center gap-3 bg-blue-600 text-white px-8 py-5 rounded-2xl hover:bg-blue-700 font-black shadow-xl">
          <Plus size={24} strokeWidth={3} /> DAFTAR PROFIL ATLET
        </button>
        <button onClick={() => setIsEnrollOpen(true)} className="flex items-center gap-3 bg-indigo-600 text-white px-8 py-5 rounded-2xl hover:bg-indigo-700 font-black shadow-xl">
          <UserCheck size={24} strokeWidth={3} /> DAFTAR ACARA
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
          <h4 className="font-black text-2xl text-slate-800 uppercase mb-8 border-b-2 border-slate-50 pb-4">Database Atlet ({students.length})</h4>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0">
                <tr><th className="p-4 text-left">Atlet</th><th className="p-4 text-center">Status</th><th className="p-4"></th></tr>
              </thead>
              <tbody>
                {students.map(s => {
                   const myParts = participations.filter(p => p.studentId === s.id);
                   const myEvents = myParts.map(p => events.find(e => e.id === p.eventId)!);
                   const ind = myEvents.filter(e => e.jenis_peserta === ParticipantType.Individual).length;
                   const grp = myEvents.filter(e => e.jenis_peserta === ParticipantType.Group).length;
                   return (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 group">
                      <td className="p-4">
                        <div className="font-black text-slate-800 uppercase">{s.nama}</div>
                        <div className="text-[10px] font-bold text-slate-400">{s.rumah} • {s.kategori}</div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black ${ind === 3 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100'}`}>{ind}/3 I</span>
                        <span className={`ml-1 px-2 py-1 rounded-full text-[10px] font-black ${grp === 1 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100'}`}>{grp}/1 B</span>
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => deleteStudent(s.id)} title="Padam Profil Atlet" className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg font-black text-[10px] flex items-center gap-1 ml-auto transition-all">
                          <Trash2 size={12} /> PADAM PROFIL
                        </button>
                      </td>
                    </tr>
                   );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
          <h4 className="font-black text-2xl text-slate-800 uppercase mb-8 border-b-2 border-slate-50 pb-4">Senarai Acara</h4>
          <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 sticky top-0">
                <tr><th className="p-4 text-left">Acara</th><th className="p-4 text-center">Kategori</th><th className="p-4 text-center">Bil</th></tr>
              </thead>
              <tbody>
                {events.map(e => (
                  <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="font-black text-slate-800 uppercase">{e.nama_acara}</div>
                      <div className="text-[10px] text-slate-400">{e.jenis_acara}</div>
                    </td>
                    <td className="p-4 text-center font-black uppercase text-xs text-slate-500">{e.kategori}</td>
                    <td className="p-4 text-center font-black">
                        {participations.filter(p => p.eventId === e.id && p.role === ParticipationRole.Main).length}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-slate-100">
        <h4 className="font-black text-2xl text-slate-800 uppercase mb-8 border-b-2 border-slate-50 pb-4">Log Penyertaan Semasa</h4>
        <div className="overflow-x-auto max-h-[400px] custom-scrollbar">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase sticky top-0">
              <tr>
                <th className="p-4 text-left">Nama Atlet</th>
                <th className="p-4 text-left">Acara</th>
                <th className="p-4 text-center">Kategori</th>
                <th className="p-4 text-center">Rumah</th>
                <th className="p-4 text-center">Peranan</th>
                <th className="p-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {participations.map(p => {
                const s = students.find(st => st.id === p.studentId);
                const ev = events.find(e => e.id === p.eventId);
                if (!s || !ev) return null;
                return (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-black uppercase text-xs">{s.nama}</td>
                    <td className="p-4 font-black uppercase text-xs text-blue-600">{ev.nama_acara}</td>
                    <td className="p-4 text-center font-black text-[10px] uppercase text-slate-400">{ev.kategori}</td>
                    <td className="p-4 text-center">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded text-white ${HOUSE_CONFIG[s.rumah].bg}`}>{s.rumah}</span>
                    </td>
                    <td className="p-4 text-center">
                       <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${p.role === ParticipationRole.Main ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>{p.role}</span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => deleteParticipation(p.id)} className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white px-3 py-1.5 rounded-lg font-black text-[10px] transition-all flex items-center gap-1 ml-auto" title="Batal Penyertaan">
                        <Trash2 size={12} /> BUANG PENYERTAAN
                      </button>
                    </td>
                  </tr>
                );
              })}
              {participations.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-slate-300 font-black uppercase italic">Tiada penyertaan aktif</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isAddStudentOpen} onClose={() => setIsAddStudentOpen(false)} title="Profil Atlet Baharu">
        <div className="space-y-5">
          <input type="text" placeholder="NO BADAN (E.G., B101)" className="w-full p-5 border-2 rounded-2xl font-black uppercase text-sm outline-none" onChange={e => setNewStudent({...newStudent, no_badan: e.target.value.toUpperCase()})} />
          <div className="relative">
                <input list="student-names" placeholder="NAMA PENUH" className="w-full p-5 pl-14 border-2 rounded-2xl font-black uppercase text-sm outline-none" onChange={e => setNewStudent({...newStudent, nama: e.target.value.toUpperCase()})} />
                <Search className="absolute left-5 top-5 text-slate-300" size={20} />
                <datalist id="student-names">{MASTER_STUDENT_NAMES.map(n => <option key={n} value={n} />)}</datalist>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select className="p-5 border-2 rounded-2xl font-black text-sm outline-none" onChange={e => setNewStudent({...newStudent, jenis_kelamin: e.target.value as any})}>
                <option value="Lelaki">Lelaki</option><option value="Perempuan">Perempuan</option>
            </select>
            <select className="p-5 border-2 rounded-2xl font-black text-sm outline-none" onChange={e => setNewStudent({...newStudent, tingkatan: e.target.value})}>
                {MASTER_CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <select className="w-full p-5 border-2 rounded-2xl font-black text-sm outline-none" onChange={e => setNewStudent({...newStudent, rumah: e.target.value as any})}>
                {Object.values(House).map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <button onClick={handleAddStudent} className="w-full bg-blue-600 text-white p-6 rounded-2xl font-black shadow-2xl hover:bg-blue-700">SIMPAN PROFIL</button>
        </div>
      </Modal>

      <Modal isOpen={isEnrollOpen} onClose={() => setIsEnrollOpen(false)} title="Daftar Acara">
        <div className="space-y-5">
          <select className="w-full p-5 border-2 rounded-2xl font-black text-sm outline-none" onChange={e => setEnrollment({...enrollment, studentId: e.target.value})}>
                <option value="">-- PILIH ATLET --</option>
                {students.sort((a,b) => a.nama.localeCompare(b.nama)).map(s => <option key={s.id} value={s.id}>{s.no_badan} - {s.nama} ({s.kategori})</option>)}
          </select>
          <select className="w-full p-5 border-2 rounded-2xl font-black text-sm outline-none" onChange={e => setEnrollment({...enrollment, eventId: e.target.value})}>
                <option value="">-- PILIH ACARA --</option>
                {events.map(e => <option key={e.id} value={e.id}>{e.nama_acara} ({e.kategori})</option>)}
          </select>
          <select className="w-full p-5 border-2 rounded-2xl font-black text-sm outline-none" onChange={e => setEnrollment({...enrollment, role: e.target.value as any})}>
                <option value={ParticipationRole.Main}>PESERTA UTAMA</option>
                <option value={ParticipationRole.Reserve}>PESERTA SIMPANAN</option>
          </select>
          <button onClick={handleEnroll} className="w-full bg-indigo-600 text-white p-6 rounded-2xl font-black shadow-2xl">SAHKAN PENYERTAAN</button>
        </div>
      </Modal>
    </div>
  );
};

// --- Start List View (Dinamik & PDF) ---
const StartListView: React.FC<{
    events: Event[],
    participations: Participation[],
    students: Student[]
}> = ({ events, participations, students }) => {
    const [selectedEventId, setSelectedEventId] = useState('');
    const listRef = useRef<HTMLDivElement>(null);

    const event = useMemo(() => events.find(e => e.id === selectedEventId), [selectedEventId, events]);
    const eventParticipants = useMemo(() => {
        if (!selectedEventId) return [];
        return participations
            .filter(p => p.eventId === selectedEventId)
            .map(p => ({
                student: students.find(s => s.id === p.studentId),
                role: p.role
            }))
            .filter(item => !!item.student)
            .sort((a, b) => {
                if (a.role === b.role) return (a.student?.nama || '').localeCompare(b.student?.nama || '');
                return a.role === ParticipationRole.Main ? -1 : 1;
            });
    }, [selectedEventId, participations, students]);

    const generatePDF = async () => {
        if (!listRef.current || !event) return;
        const { jsPDF } = (window as any).jspdf;
        const canvas = await (window as any).html2canvas(listRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const ratio = pdfWidth / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, canvas.height * ratio);
        pdf.save(`Senarai_Mula_${event.nama_acara}_${event.kategori}.pdf`);
    };

    return (
        <div className="animate-slide-in space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 no-print">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">🏃 Pilih Acara Kejohanan</label>
                        <select className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-700 uppercase outline-none focus:border-blue-500" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                            <option value="">-- PILIH ACARA --</option>
                            {events.map(e => <option key={e.id} value={e.id}>{e.nama_acara} ({e.kategori})</option>)}
                        </select>
                    </div>
                    {event && (
                        <button onClick={generatePDF} className="flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 shadow-lg">
                            <Printer size={20} /> CETAK SENARAI MULA
                        </button>
                    )}
                </div>
            </div>

            {event ? (
                <div ref={listRef} className="bg-white p-12 shadow-2xl border-slate-200 mx-auto max-w-[210mm] border-t-[10px] border-blue-600">
                    <div className="text-center mb-10 border-b-2 border-slate-100 pb-8">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">SMK LANDAS</h1>
                        <h2 className="text-xl font-bold mt-1 text-blue-600 uppercase tracking-widest">SENARAI MULA RASMI</h2>
                        <div className="mt-4 flex justify-center gap-6">
                            <span className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black uppercase">Acara: {event.nama_acara}</span>
                            <span className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black uppercase">Kategori: {event.kategori}</span>
                        </div>
                    </div>

                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-3 text-center text-[10px] uppercase font-black w-12">Bil</th>
                                <th className="p-3 text-left text-[10px] uppercase font-black w-24">No Badan</th>
                                <th className="p-3 text-left text-[10px] uppercase font-black">Nama Atlet</th>
                                <th className="p-3 text-center text-[10px] uppercase font-black w-24">Rumah</th>
                                <th className="p-3 text-center text-[10px] uppercase font-black w-24">Peranan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventParticipants.map((p, idx) => (
                                <tr key={p.student?.id} className="border-b h-12">
                                    <td className="p-3 text-center font-black">{idx + 1}</td>
                                    <td className="p-3 font-mono font-bold text-xs uppercase text-blue-600">{p.student?.no_badan}</td>
                                    <td className="p-3 font-black uppercase text-[11px] leading-tight">{p.student?.nama}</td>
                                    <td className="p-3 text-center">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${HOUSE_CONFIG[p.student!.rumah].bg} text-white`}>
                                            {p.student?.rumah}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${p.role === ParticipationRole.Main ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                            {p.role.toUpperCase()}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {eventParticipants.length === 0 && (
                                <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic">Tiada atlet didaftarkan</td></tr>
                            )}
                        </tbody>
                    </table>
                    
                    <div className="mt-16 text-[8px] font-black text-slate-300 flex justify-between uppercase">
                        <span>Dijana oleh Sistem Pengurusan Sukan SMK LANDAS</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-3xl p-24 text-center">
                    <List size={64} className="mx-auto text-slate-100 mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Sila pilih acara kejohanan</p>
                </div>
            )}
        </div>
    );
};

// --- Judge Form View (Borang Hakim) ---
const JudgeFormView: React.FC<{
    events: Event[],
    participations: Participation[],
    students: Student[],
    schedules: Schedule[]
}> = ({ events, participations, students, schedules }) => {
    const [selectedEventId, setSelectedEventId] = useState('');
    const formRef = useRef<HTMLDivElement>(null);

    const event = useMemo(() => events.find(e => e.id === selectedEventId), [selectedEventId, events]);
    const isFieldEvent = event?.jenis_acara === EventType.Field;

    const eventParticipants = useMemo(() => {
        if (!selectedEventId) return [];
        return participations
            .filter(p => p.eventId === selectedEventId && p.role === ParticipationRole.Main)
            .map(p => ({
                student: students.find(s => s.id === p.studentId),
            }))
            .filter(item => !!item.student)
            .sort((a, b) => (a.student?.nama || '').localeCompare(b.student?.nama || ''));
    }, [selectedEventId, participations, students]);

    const generatePDF = async () => {
        if (!formRef.current || !event) return;
        const { jsPDF } = (window as any).jspdf;
        const canvas = await (window as any).html2canvas(formRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const ratio = pdfWidth / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, canvas.height * ratio);
        pdf.save(`Borang_Hakim_${event.nama_acara}_${event.kategori}.pdf`);
    };

    return (
        <div className="animate-slide-in space-y-8">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 no-print">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="flex-1 w-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">⚖️ Pilih Acara Untuk Borang Hakim</label>
                        <select className="w-full p-4 border-2 border-slate-100 rounded-2xl font-black text-slate-700 uppercase outline-none focus:border-blue-500" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
                            <option value="">-- PILIH ACARA --</option>
                            {events.map(e => <option key={e.id} value={e.id}>{e.nama_acara} ({e.kategori})</option>)}
                        </select>
                    </div>
                    {event && (
                        <button onClick={generatePDF} className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 shadow-lg">
                            <Printer size={20} /> CETAK BORANG HAKIM
                        </button>
                    )}
                </div>
            </div>

            {event ? (
                <div ref={formRef} className="bg-white p-12 shadow-2xl border-slate-200 mx-auto max-w-[210mm] border-t-[10px] border-slate-900">
                    <div className="text-center mb-10 border-b-2 border-slate-100 pb-8">
                        <h1 className="text-2xl font-black uppercase tracking-tighter">SMK LANDAS</h1>
                        <h2 className="text-xl font-bold mt-1 text-slate-900 uppercase tracking-widest">BORANG KEPUTUSAN HAKIM</h2>
                        <div className="mt-4 flex justify-center gap-6">
                            <span className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black uppercase">Acara: {event.nama_acara}</span>
                            <span className="bg-slate-100 px-4 py-1 rounded-full text-[10px] font-black uppercase">Kategori: {event.kategori}</span>
                        </div>
                        {isFieldEvent && (
                           <p className="mt-2 text-[10px] font-black uppercase text-blue-600">Acara Padang: 3 Kali Percubaan Diberikan</p>
                        )}
                    </div>

                    <table className="w-full border-collapse border-2 border-slate-900">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="p-3 border-2 border-slate-900 text-center text-[10px] uppercase font-black w-10">Bil</th>
                                <th className="p-3 border-2 border-slate-900 text-left text-[10px] uppercase font-black w-20">No Badan</th>
                                <th className="p-3 border-2 border-slate-900 text-left text-[10px] uppercase font-black">Nama Atlet</th>
                                {isFieldEvent ? (
                                   <>
                                      <th className="p-3 border-2 border-slate-900 text-center text-[10px] uppercase font-black w-12">P1</th>
                                      <th className="p-3 border-2 border-slate-900 text-center text-[10px] uppercase font-black w-12">P2</th>
                                      <th className="p-3 border-2 border-slate-900 text-center text-[10px] uppercase font-black w-12">P3</th>
                                      <th className="p-3 border-2 border-slate-900 text-center text-[10px] uppercase font-black w-16">Terbaik</th>
                                   </>
                                ) : (
                                   <th className="p-3 border-2 border-slate-900 text-center text-[10px] uppercase font-black w-32">Keputusan (Masa)</th>
                                )}
                                <th className="p-3 border-2 border-slate-900 text-center text-[10px] uppercase font-black w-16">No.</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventParticipants.map((p, idx) => (
                                <tr key={p.student?.id} className="h-14">
                                    <td className="p-3 border-2 border-slate-900 text-center font-black">{idx + 1}</td>
                                    <td className="p-3 border-2 border-slate-900 font-mono font-bold text-xs uppercase">{p.student?.no_badan}</td>
                                    <td className="p-3 border-2 border-slate-900 font-black uppercase text-[10px] leading-tight">{p.student?.nama}</td>
                                    {isFieldEvent ? (
                                       <>
                                          <td className="border-2 border-slate-900"></td>
                                          <td className="border-2 border-slate-900"></td>
                                          <td className="border-2 border-slate-900"></td>
                                          <td className="border-2 border-slate-900 bg-slate-50"></td>
                                       </>
                                    ) : (
                                       <td className="border-2 border-slate-900"></td>
                                    )}
                                    <td className="p-3 border-2 border-slate-900"></td>
                                </tr>
                            ))}
                            {[...Array(Math.max(0, 10 - eventParticipants.length))].map((_, i) => (
                                <tr key={`empty-${i}`} className="h-14">
                                    <td className="p-3 border-2 border-slate-900 text-center font-black">{eventParticipants.length + i + 1}</td>
                                    <td className="p-3 border-2 border-slate-900"></td>
                                    <td className="p-3 border-2 border-slate-900"></td>
                                    {isFieldEvent ? (
                                       <>
                                          <td className="border-2 border-slate-900"></td>
                                          <td className="border-2 border-slate-900"></td>
                                          <td className="border-2 border-slate-900"></td>
                                          <td className="border-2 border-slate-900 bg-slate-50"></td>
                                       </>
                                    ) : (
                                       <td className="border-2 border-slate-900"></td>
                                    )}
                                    <td className="p-3 border-2 border-slate-900"></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    
                    <div className="mt-16 grid grid-cols-2 gap-20">
                        <div className="text-center">
                            <div className="border-b-2 border-slate-900 h-10"></div>
                            <p className="mt-2 text-[10px] font-black uppercase">Tandatangan Hakim 1</p>
                        </div>
                        <div className="text-center">
                            <div className="border-b-2 border-slate-900 h-10"></div>
                            <p className="mt-2 text-[10px] font-black uppercase">Tandatangan Ketua Hakim</p>
                        </div>
                    </div>

                    <div className="mt-16 text-[8px] font-black text-slate-300 flex justify-between uppercase">
                        <span>Borang Rasmi Kejohanan Sukan SMK LANDAS</span>
                        <span>{new Date().toLocaleString()}</span>
                    </div>
                </div>
            ) : (
                <div className="bg-slate-50/50 border-4 border-dashed border-slate-100 rounded-3xl p-24 text-center">
                    <Gavel size={64} className="mx-auto text-slate-100 mb-6" />
                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Sila pilih acara untuk menjana borang hakim</p>
                </div>
            )}
        </div>
    );
};

// --- Results View (Judge Input) ---
const ResultsView: React.FC<{
  events: Event[],
  participations: Participation[],
  students: Student[],
  results: Result[],
  setResults: any,
  showToast: any
}> = ({ events, participations, students, results, setResults, showToast }) => {
  const [selectedEventId, setSelectedEventId] = useState('');
  const [newResult, setNewResult] = useState<Partial<Result>>({ tempat: 1, hasil: '', bonusRekod: false });

  const event = useMemo(() => events.find(e => e.id === selectedEventId), [selectedEventId, events]);
  const currentEventResults = useMemo(() => results.filter(r => r.eventId === selectedEventId).sort((a,b) => a.tempat - b.tempat), [selectedEventId, results]);
  
  const eligibleStudents = useMemo(() => {
    if (!selectedEventId) return [];
    return participations
      .filter(p => p.eventId === selectedEventId && p.role === ParticipationRole.Main)
      .map(p => students.find(s => s.id === p.studentId))
      .filter((s): s is Student => !!s && !currentEventResults.some(r => r.studentId === s.id));
  }, [selectedEventId, participations, students, currentEventResults]);

  const handleAddResult = () => {
    if (!selectedEventId || !newResult.studentId || !newResult.tempat) {
      showToast('Sila lengkapkan maklumat keputusan!', 'error'); return;
    }
    
    if (currentEventResults.some(r => r.tempat === newResult.tempat)) {
      showToast(`Tempat ke-${newResult.tempat} sudah mempunyai pemenang!`, 'error'); return;
    }

    const res: Result = { ...newResult as Result, eventId: selectedEventId, id: Date.now().toString() };
    const updated = [...results, res];
    setResults(updated);
    dataSdk.saveResults(updated);
    showToast('Keputusan berjaya direkod!', 'success');
  };

  const deleteResult = (id: string) => {
    const updated = results.filter(r => r.id !== id);
    setResults(updated);
    dataSdk.saveResults(updated);
    showToast('Keputusan dipadam.', 'success');
  };

  return (
    <div className="animate-slide-in space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
        <h4 className="font-black text-xl mb-6 uppercase flex items-center gap-3">
          <Award className="text-amber-500" /> Kemasukan Keputusan Acara
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
          <div className="flex-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Pilih Acara</label>
            <select className="w-full p-4 border-2 rounded-2xl font-black text-sm outline-none bg-slate-50" value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}>
              <option value="">-- PILIH ACARA --</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.nama_acara} ({e.kategori})</option>)}
            </select>
          </div>
        </div>

        {event && (
          <div className="mt-10 p-6 bg-slate-50 rounded-[2rem] border-2 border-slate-100 space-y-6">
            <h5 className="font-black uppercase text-sm text-slate-400">Tambah Pemenang Baru</h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Tempat</label>
                <select className="w-full p-4 border rounded-xl font-bold text-sm" value={newResult.tempat} onChange={e => setNewResult({...newResult, tempat: parseInt(e.target.value)})}>
                  {[1, 2, 3, 4, 5].map(t => <option key={t} value={t}>Tempat Ke-{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Atlet</label>
                <select className="w-full p-4 border rounded-xl font-bold text-sm" value={newResult.studentId || ''} onChange={e => setNewResult({...newResult, studentId: e.target.value})}>
                  <option value="">-- PILIH ATLET --</option>
                  {eligibleStudents.map(s => <option key={s.id} value={s.id}>{s.no_badan} - {s.nama} ({s.rumah})</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase ml-1 mb-1 block">Masa/Jarak/Tinggi</label>
                <input type="text" placeholder="E.G., 12.5s / 5.2m" className="w-full p-4 border rounded-xl font-bold text-sm uppercase" value={newResult.hasil} onChange={e => setNewResult({...newResult, hasil: e.target.value.toUpperCase()})} />
              </div>
              <button onClick={handleAddResult} className="bg-emerald-600 text-white p-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                <Save size={18} /> SIMPAN KEPUTUSAN
              </button>
            </div>
            <div className="flex items-center gap-3 ml-1">
               <input type="checkbox" id="bonus" className="w-5 h-5 rounded accent-blue-600" checked={newResult.bonusRekod} onChange={e => setNewResult({...newResult, bonusRekod: e.target.checked})} />
               <label htmlFor="bonus" className="text-xs font-black uppercase text-slate-600 cursor-pointer">Rekod Baru Kejohanan (+{RECORD_BONUS} Mata)</label>
            </div>
          </div>
        )}
      </div>

      {event && (
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
           <table className="w-full">
              <thead className="bg-slate-900 text-white">
                 <tr>
                    <th className="p-4 text-center text-xs uppercase font-black w-20">Tempat</th>
                    <th className="p-4 text-left text-xs uppercase font-black">Atlet & Rumah</th>
                    <th className="p-4 text-center text-xs uppercase font-black">Keputusan</th>
                    <th className="p-4 text-center text-xs uppercase font-black">Mata</th>
                    <th className="p-4 text-right text-xs uppercase font-black w-20"></th>
                 </tr>
              </thead>
              <tbody>
                 {currentEventResults.map(r => {
                    const student = students.find(s => s.id === r.studentId);
                    let p = (event.jenis_peserta === ParticipantType.Individual) ? (INDIVIDUAL_POINTS[r.tempat - 1] || 0) : (GROUP_POINTS[r.tempat - 1] || 0);
                    if (r.bonusRekod) p += RECORD_BONUS;
                    return (
                       <tr key={r.id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="p-4 text-center">
                             <span className="text-2xl font-black">{r.tempat === 1 ? '🥇' : r.tempat === 2 ? '🥈' : r.tempat === 3 ? '🥉' : r.tempat}</span>
                          </td>
                          <td className="p-4">
                             <div className="font-black text-slate-800 uppercase text-xs">{student?.nama}</div>
                             <div className={`text-[10px] font-black uppercase ${HOUSE_CONFIG[student!.rumah].text}`}>{student?.rumah}</div>
                          </td>
                          <td className="p-4 text-center font-mono font-bold text-blue-600 text-sm">
                             {r.hasil} {r.bonusRekod && <span className="ml-2 bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[8px] font-black">REKOD</span>}
                          </td>
                          <td className="p-4 text-center">
                             <span className="bg-slate-100 px-3 py-1 rounded-full font-black text-xs">{p} MATA</span>
                          </td>
                          <td className="p-4 text-right">
                             <button onClick={() => deleteResult(r.id)} className="text-slate-300 hover:text-rose-600 p-2"><Trash2 size={20} /></button>
                          </td>
                       </tr>
                    );
                 })}
                 {currentEventResults.length === 0 && (
                    <tr><td colSpan={5} className="p-20 text-center text-slate-300 font-black uppercase italic">Belum ada keputusan direkodkan</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

// --- Reports View (Standings & Summaries) ---
const ReportsView: React.FC<{
  results: Result[],
  students: Student[],
  events: Event[],
  housePoints: { house: House, totalPoints: number }[]
}> = ({ results, students, events, housePoints }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => ({
    totalStudents: students.length,
    totalEvents: events.length,
    resultsRecorded: results.length,
    totalRecords: results.filter(r => r.bonusRekod).length
  }), [students, events, results]);

  const generatePDF = async () => {
    if (!reportRef.current) return;
    const { jsPDF } = (window as any).jspdf;
    const canvas = await (window as any).html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const ratio = pdfWidth / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, canvas.height * ratio);
    pdf.save(`Laporan_Kejohanan_SMK_LANDAS.pdf`);
  };

  return (
    <div className="animate-slide-in space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 no-print flex justify-between items-center">
         <div>
            <h4 className="font-black text-xl uppercase">Laporan Keseluruhan</h4>
            <p className="text-slate-400 text-sm">Rumusan mata dan keputusan kejohanan semasa</p>
         </div>
         <button onClick={generatePDF} className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs hover:bg-emerald-700 shadow-lg">
            <Printer size={20} /> CETAK LAPORAN RASMI
         </button>
      </div>

      <div ref={reportRef} className="bg-white p-16 shadow-2xl border-slate-200 mx-auto max-w-[210mm]">
          <div className="text-center mb-12 border-b-4 border-slate-900 pb-8">
              <h1 className="text-3xl font-black uppercase tracking-tighter">SMK LANDAS</h1>
              <h2 className="text-xl font-bold mt-1 text-slate-600 uppercase tracking-widest">LAPORAN RASMI KEJOHANAN SUKAN TAHUNAN</h2>
              <p className="text-xs font-bold text-slate-400 mt-2">DOKUMEN INI DIJANA SECARA DIGITAL • {new Date().toLocaleDateString()}</p>
          </div>

          <div className="grid grid-cols-4 gap-6 mb-12">
             <div className="border-2 border-slate-100 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Jumlah Atlet</p>
                <p className="text-2xl font-black">{stats.totalStudents}</p>
             </div>
             <div className="border-2 border-slate-100 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Jumlah Acara</p>
                <p className="text-2xl font-black">{stats.totalEvents}</p>
             </div>
             <div className="border-2 border-slate-100 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Keputusan</p>
                <p className="text-2xl font-black">{stats.resultsRecorded}</p>
             </div>
             <div className="border-2 border-slate-100 p-4 rounded-2xl text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Rekod Baru</p>
                <p className="text-2xl font-black text-amber-600">{stats.totalRecords}</p>
             </div>
          </div>

          <div className="mb-12">
             <h3 className="text-lg font-black uppercase mb-4 border-l-8 border-blue-600 pl-4">KEDUDUKAN RUMAH SUKAN</h3>
             <table className="w-full border-collapse">
                <thead className="bg-slate-100">
                   <tr>
                      <th className="p-3 border text-center text-xs font-black w-16">RANK</th>
                      <th className="p-3 border text-left text-xs font-black">RUMAH SUKAN</th>
                      <th className="p-3 border text-center text-xs font-black w-32">MATA</th>
                   </tr>
                </thead>
                <tbody>
                   {housePoints.map((hp, idx) => (
                      <tr key={hp.house}>
                         <td className="p-3 border text-center font-black">{idx + 1}</td>
                         <td className="p-3 border font-black uppercase tracking-widest text-xs">{hp.house}</td>
                         <td className="p-3 border text-center font-black text-xl">{hp.totalPoints}</td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>

          <div>
             <h3 className="text-lg font-black uppercase mb-4 border-l-8 border-emerald-600 pl-4">RINGKASAN PEMENANG ACARA</h3>
             <div className="space-y-6">
                {events.map(ev => {
                   const evRes = results.filter(r => r.eventId === ev.id).sort((a,b) => a.tempat - b.tempat);
                   if (evRes.length === 0) return null;
                   return (
                      <div key={ev.id} className="border p-4 rounded-xl">
                         <div className="flex justify-between items-center mb-2">
                            <h4 className="font-black text-xs uppercase">{ev.nama_acara} - {ev.kategori}</h4>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">{ev.jenis_peserta}</span>
                         </div>
                         <div className="grid grid-cols-1 gap-1">
                            {evRes.map(r => {
                               const s = students.find(st => st.id === r.studentId);
                               return (
                                  <div key={r.id} className="text-[10px] flex items-center justify-between border-b border-dotted pb-1">
                                     <span className="font-bold">{r.tempat}. {s?.nama} ({s?.rumah})</span>
                                     <span className="font-mono">{r.hasil}</span>
                                  </div>
                               );
                            })}
                         </div>
                      </div>
                   );
                })}
             </div>
          </div>

          <div className="mt-20 flex justify-between gap-10">
            <div className="flex-1 border-t-2 border-slate-900 pt-2 text-center text-[10px] font-black uppercase">Disediakan Oleh</div>
            <div className="flex-1 border-t-2 border-slate-900 pt-2 text-center text-[10px] font-black uppercase">Disahkan Oleh Pengetua</div>
          </div>
      </div>
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
    const storedStudents = dataSdk.getStudents();
    const storedParticipations = dataSdk.getParticipations();
    const storedSchedules = dataSdk.getSchedules();
    const storedResults = dataSdk.getResults();

    setStudents(storedStudents);
    setEvents(MASTER_EVENTS);
    setParticipations(storedParticipations);
    setSchedules(storedSchedules);
    setResults(storedResults);
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

  const maxPoints = Math.max(...housePoints.map(h => h.totalPoints), 1);

  const tabs = [
    { id: 'leaderboard', icon: Trophy, label: 'Leaderboard' },
    { id: 'registration', icon: UserPlus, label: 'Pendaftaran' },
    { id: 'startlist', icon: List, label: 'Senarai Mula' },
    { id: 'judge', icon: Gavel, label: 'Borang Hakim' },
    { id: 'results', icon: Award, label: 'Keputusan' },
    { id: 'reports', icon: FileText, label: 'Laporan' },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-12 bg-[#f4f7fa]">
      <header className="bg-slate-900 text-white py-12 px-8 shadow-2xl sticky top-0 z-40 border-b-[8px] border-blue-600 no-print overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12 translate-x-1/4">
            <Trophy size={200} />
        </div>
        <div className="container mx-auto relative z-10">
          <div className="flex items-center gap-8">
            <div className="bg-white p-2 rounded-2xl shadow-2xl rotate-3 flex items-center justify-center overflow-hidden">
              <img src="https://i.imgur.com/r6TqmA5.png" alt="SMK LANDAS Logo" className="w-20 h-20 object-contain filter drop-shadow-lg" />
            </div>
            <div>
              <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-none mb-2">SMK LANDAS</h1>
              <p className="text-blue-400 font-black text-xs md:text-sm uppercase tracking-[0.6em] leading-none opacity-80">Sistem Pengurusan Kejohanan Sukan Tahunan</p>
            </div>
          </div>
        </div>
      </header>

      <nav className="bg-white/80 backdrop-blur-md border-b shadow-xl sticky top-[160px] md:top-[176px] z-30 overflow-x-auto no-scrollbar py-3 no-print">
        <div className="container mx-auto flex gap-4 px-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-3 px-10 py-5 font-black text-[11px] uppercase tracking-[0.2em] transition-all rounded-[1.25rem] whitespace-nowrap ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-2xl shadow-blue-200 -translate-y-1' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
              <tab.icon size={20} strokeWidth={activeTab === tab.id ? 3 : 2} /> {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12 max-w-7xl text-slate-800">
        {activeTab === 'leaderboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 animate-slide-in">
            {housePoints.map((hp, idx) => {
              const config = HOUSE_CONFIG[hp.house];
              const medals = ['🥇', '🥈', '🥉', '🏅'];
              return (
                <div key={hp.house} className="bg-white rounded-[2rem] shadow-2xl border-l-[12px] md:border-l-[20px] p-6 md:p-8 relative overflow-hidden group hover:-translate-y-2 transition-all" style={{ borderLeftColor: config.color }}>
                   <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Trophy size={80} style={{ color: config.color }} />
                   </div>
                   <div className="flex justify-between items-start mb-4 md:mb-6">
                     <div className="flex items-center gap-3 md:gap-5">
                       <span className="text-4xl md:text-5xl">{medals[idx]}</span>
                       <div>
                         <h4 className={`text-xl md:text-2xl font-black leading-tight ${config.text}`}>{hp.house}</h4>
                         <p className="text-[8px] md:text-[9px] font-black uppercase text-slate-400 tracking-wider mt-0.5">Hagemony Challenger</p>
                       </div>
                     </div>
                     <div className="text-right">
                       <span className="text-3xl md:text-4xl font-black text-slate-800 tabular-nums leading-none">{hp.totalPoints}</span>
                       <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Mata</p>
                     </div>
                   </div>
                   <div className="w-full bg-slate-100 h-4 md:h-5 rounded-full overflow-hidden shadow-inner">
                     <div className={`h-full ${config.bg} transition-all duration-1000 ease-out`} style={{ width: `${(hp.totalPoints/maxPoints)*100}%` }}></div>
                   </div>
                </div>
              );
            })}
          </div>
        )}
        
        {activeTab === 'registration' && (
            <RegistrationView 
                students={students} setStudents={setStudents} 
                events={events} 
                participations={participations} setParticipations={setParticipations} 
                deleteStudent={(id: string) => {
                    if (confirm('Hapus profil atlet ini? Semua penyertaan akan turut dipadam.')) {
                        const updatedS = students.filter(s => s.id !== id);
                        const updatedP = participations.filter(p => p.studentId !== id);
                        setStudents(updatedS); setParticipations(updatedP);
                        dataSdk.saveStudents(updatedS); dataSdk.saveParticipations(updatedP);
                        showToast('Profil atlet telah dipadam.', 'success');
                    }
                }} 
                showToast={showToast} 
            />
        )}

        {activeTab === 'startlist' && <StartListView events={events} participations={participations} students={students} />}

        {activeTab === 'judge' && <JudgeFormView events={events} participations={participations} students={students} schedules={schedules} />}

        {activeTab === 'results' && <ResultsView events={events} participations={participations} students={students} results={results} setResults={setResults} showToast={showToast} />}

        {activeTab === 'reports' && <ReportsView results={results} students={students} events={events} housePoints={housePoints} />}

      </main>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <footer className="no-print mt-20 py-10 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
        &copy; 2024 SMK LANDAS • SPORTS MEET MANAGEMENT CORE
      </footer>
    </div>
  );
};

export default App;
