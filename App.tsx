
import React, { useState, useEffect, useMemo } from 'react';
import { View, Team, Scenario, Submission, RoundType, GameState, Voter, CollectiveType } from './types';
import { generateWeeklyChallenge } from './services/geminiService';
import { 
  Activity, Trophy, Users, Target, Send, BarChart3, 
  LogIn, UserPlus, LogOut, Loader2, Zap, 
  MessageSquare, Image as ImageIcon, Video, Star, ChevronRight, 
  QrCode, ShieldCheck, Home, ArrowLeft, Download, Trash2, Info, FileText, CheckCircle, 
  Settings, Clock, Calendar, Lock, UserCheck, RotateCcw
} from 'lucide-react';

const ADMIN_CREDENTIALS = { user: 'admin_zonzamas', pass: 'Zonzamas2025' };

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('zonzamas_ai_battle_final_v1');
    if (saved) return JSON.parse(saved);
    return {
      currentVoter: null,
      currentTeam: null,
      currentScenario: null,
      historyScenarios: [],
      teams: [],
      voters: [],
      submissions: [],
      view: 'login',
      isAdminAuthenticated: false,
      baseChallengeNumber: 1
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('zonzamas_ai_battle_final_v1', JSON.stringify(state));
  }, [state]);

  const getPhaseInfo = () => {
    const now = currentTime;
    const day = now.getDay(); // 0: Dom, 1: Lun, ...
    
    // Votaciones: Lunes (1) y Martes (2) hasta las 23:59:59
    const isVotingPeriod = day === 1 || day === 2;
    
    // Entregas: Hasta el Domingo (0) a las 23:59:59
    // Calculamos tiempo hasta el próximo domingo a las 23:59:59
    const nextSunday = new Date(now);
    const daysUntilSunday = day === 0 ? 0 : 7 - day;
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(23, 59, 59, 999);
    
    const diff = nextSunday.getTime() - now.getTime();
    const daysLeft = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minsLeft = Math.floor((diff / 1000 / 60) % 60);
    const secsLeft = Math.floor((diff / 1000) % 60);

    return {
      isVotingPeriod,
      countdown: `${daysLeft}d ${hoursLeft}h ${minsLeft}m ${secsLeft}s`,
      canSubmit: true, // Siempre se puede enviar para el reto vigente
      canVote: isVotingPeriod
    };
  };

  const phase = getPhaseInfo();

  const handleGenerate = async (forcedNumber?: number) => {
    setIsLoading(true);
    try {
      const nextNum = forcedNumber || (state.currentScenario ? state.currentScenario.number + 1 : state.baseChallengeNumber);
      const week = Math.ceil(Date.now() / (7 * 24 * 60 * 60 * 1000) % 52);
      const challenge = await generateWeeklyChallenge(week, nextNum);
      
      setState(prev => ({ 
        ...prev, 
        currentScenario: challenge,
        historyScenarios: prev.currentScenario ? [...prev.historyScenarios, prev.currentScenario] : prev.historyScenarios
      }));
    } catch (e) {
      alert("Error en la IA. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginVoter = (email: string) => {
    const voter = state.voters.find(v => v.email.toLowerCase() === email.toLowerCase());
    if (!voter) {
      alert("No estás registrado como votante o capitán. Por favor, regístrate primero.");
      return;
    }
    setState(prev => ({ ...prev, currentVoter: voter, view: 'dashboard' }));
    
    const team = state.teams.find(t => t.captainEmail.toLowerCase() === email.toLowerCase());
    if (team) setState(prev => ({ ...prev, currentTeam: team }));
  };

  const registerVoter = (name: string, email: string, role: CollectiveType) => {
    if (state.voters.find(v => v.email.toLowerCase() === email.toLowerCase())) {
      alert("Este email ya está registrado.");
      return;
    }
    const newVoter: Voter = { id: Math.random().toString(36).substr(2, 9), name, email, role, votes: {} };
    setState(prev => ({ ...prev, voters: [...prev.voters, newVoter], currentVoter: newVoter, view: 'dashboard' }));
  };

  const renderView = () => {
    switch (state.view) {
      case 'login': return <LoginView onLogin={loginVoter} onRegisterTeam={() => setState(p=>({...p, view:'register-team'}))} onRegisterVoter={() => setState(p=>({...p, view:'voter-register'}))} onAdminLogin={() => setState(p=>({...p, view:'admin-login'}))} />;
      case 'voter-register': return <VoterRegisterView onRegister={registerVoter} onBack={() => setState(p=>({...p, view:'login'}))} />;
      case 'admin-login': return <AdminLoginView onLogin={(u:string, p:string) => {
        if(u === ADMIN_CREDENTIALS.user && p === ADMIN_CREDENTIALS.pass) {
          setState(prev => ({...prev, isAdminAuthenticated: true, view: 'admin'}));
        } else { alert("Credenciales incorrectas"); }
      }} onBack={() => setState(p=>({...p, view:'login'}))} />;
      case 'register-team': return <RegisterView onRegister={(t:any) => {
        const teamId = Math.random().toString(36).substr(2, 9);
        const newTeam = {...t, id: teamId, totalWins: 0, registeredAt: new Date().toLocaleString()};
        const newVoter: Voter = { id: Math.random().toString(36).substr(2, 9), name: `Capitán/a ${t.name}`, email: t.captainEmail, role: t.collective, votes: {} };
        setState(prev => ({...prev, teams: [...prev.teams, newTeam], voters: [...prev.voters, newVoter], currentVoter: newVoter, currentTeam: newTeam, view: 'dashboard'}));
      }} onBack={() => setState(p=>({...p, view:'login'}))} />;
      case 'dashboard': return <DashboardView state={state} phase={phase} onNavigate={(v:View) => setState(p=>({...p, view:v}))} />;
      case 'submit': return <SubmitView scenario={state.currentScenario} onCancel={() => setState(p=>({...p, view:'dashboard'}))} onSubmit={(d:any) => {
        const sub: Submission = { id: Math.random().toString(36).substr(2, 9), teamId: state.currentTeam!.id, teamName: state.currentTeam!.name, collective: state.currentTeam!.collective, challengeId: state.currentScenario!.id, challengeNumber: state.currentScenario!.number, ...d, votes: 0, timestamp: new Date().toLocaleString() };
        setState(prev => ({ ...prev, submissions: [...prev.submissions, sub], view: 'gallery' }));
      }} />;
      case 'gallery': return <GalleryView state={state} phase={phase} onVote={(subId: string, category: RoundType) => {
        if (!state.currentVoter) return alert("Debes estar registrado para votar.");
        if (!phase.canVote) return alert("Las votaciones solo están abiertas Lunes y Martes.");
        
        // Se vota el reto que acaba de terminar (el último en el historial o el actual si es el primero)
        const activeChallengeId = state.historyScenarios.length > 0 
          ? state.historyScenarios[state.historyScenarios.length - 1].id 
          : state.currentScenario?.id;

        if (!activeChallengeId) return;

        const alreadyVoted = state.currentVoter.votes[activeChallengeId]?.[category];
        if (alreadyVoted) return alert(`Ya has votado en la categoría ${category} para este reto.`);

        setState(prev => ({
          ...prev,
          submissions: prev.submissions.map(s => s.id === subId ? {...s, votes: s.votes + 1} : s),
          voters: prev.voters.map(v => v.id === state.currentVoter?.id ? {
            ...v, 
            votes: {
              ...v.votes,
              [activeChallengeId]: { ...(v.votes[activeChallengeId] || {}), [category]: subId }
            }
          } : v),
          currentVoter: state.currentVoter ? {
            ...state.currentVoter,
            votes: {
              ...state.currentVoter.votes,
              [activeChallengeId]: { ...(state.currentVoter.votes[activeChallengeId] || {}), [category]: subId }
            }
          } : null
        }));
      }} onBack={() => setState(p=>({...p, view:'dashboard'}))} />;
      case 'ranking': return <RankingView teams={state.teams} onBack={() => setState(p=>({...p, view:'dashboard'}))} />;
      case 'admin': return <AdminPanel state={state} onGenerate={handleGenerate} setBaseChallenge={(n:number) => setState(p=>({...p, baseChallengeNumber: n}))} onBack={() => setState(p=>({...p, view:'login', isAdminAuthenticated: false}))} />;
      default: return <LoginView onLogin={loginVoter} onRegisterTeam={() => setState(p=>({...p, view:'register-team'}))} onRegisterVoter={() => setState(p=>({...p, view:'voter-register'}))} onAdminLogin={() => setState(p=>({...p, view:'admin-login'}))} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-orange-200">
      <nav className="bg-white border-b-4 border-zonzamas-orange px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setState(p=>({...p, view: state.currentVoter ? 'dashboard' : 'login'}))}>
            <img src="https://www.cifpzonzamas.es/img/logol.webp" alt="Logo" className="h-10" />
            <div>
              <h1 className="font-comic text-2xl zonzamas-blue leading-none uppercase tracking-tight">ZONZAMAS AI BATTLE</h1>
              <span className="text-[10px] font-black uppercase tracking-widest text-zonzamas-orange">Prompt Engineering Challenge</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {state.currentVoter && (
              <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                <div className="text-right hidden sm:block">
                  <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Master Prompter</p>
                  <p className="text-xs font-bold zonzamas-blue">{state.currentVoter.name}</p>
                </div>
                <button onClick={() => setState(p=>({...p, currentVoter:null, currentTeam:null, view:'login'}))} className="text-slate-300 hover:text-red-500 transition-colors"><LogOut className="w-5 h-5" /></button>
              </div>
            )}
            {state.isAdminAuthenticated && <span className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 shadow-lg"><ShieldCheck className="w-4 h-4 text-green-400" /> Admin Mode</span>}
          </div>
        </div>
      </nav>
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">{renderView()}</main>
      <footer className="bg-slate-900 text-white p-8 border-t-8 border-zonzamas-blue">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-left">
            <p className="text-xs font-black uppercase tracking-widest text-blue-400 mb-2">CIFP Zonzamas • Lanzarote</p>
            <p className="text-[11px] text-slate-300 font-bold uppercase mb-1">Idea original de Diego Martín Suárez</p>
            <p className="text-[10px] text-slate-500 max-w-md leading-relaxed">Plataforma de gamificación para el módulo de Digitalización. El tratamiento de datos es estrictamente académico y temporal.</p>
          </div>
          <p className="text-xs font-bold uppercase tracking-widest opacity-30">© 2025 AI Battle System</p>
        </div>
      </footer>
    </div>
  );
};

// --- COMPONENTES ---

const LoginView = ({ onLogin, onRegisterTeam, onRegisterVoter, onAdminLogin }: any) => {
  const [email, setEmail] = useState('');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center py-10">
      <div className="space-y-10 animate-in slide-in-from-left duration-700">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="bg-zonzamas-blue text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Temporada 1</span>
            <span className="text-[11px] font-black text-zonzamas-orange uppercase tracking-[0.2em] animate-pulse">Idea original de Diego Martín Suárez</span>
          </div>
          <h2 className="text-8xl font-comic zonzamas-blue leading-[0.85] uppercase">DOMINA EL <span className="text-zonzamas-orange">ALGORITMO</span></h2>
          <p className="text-xl text-slate-500 max-w-lg leading-relaxed font-medium italic">
            Participa en los desafíos semanales y demuestra tu maestría con la IA Generativa.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
           <button onClick={onRegisterVoter} className="flex items-center gap-4 p-6 bg-white border-2 border-slate-100 rounded-[2rem] shadow-xl hover:scale-105 transition-all group">
              <UserCheck className="w-8 h-8 text-zonzamas-blue" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase opacity-60">Quiero Votar</p>
                <p className="text-lg font-comic uppercase">REGISTRARME</p>
              </div>
           </button>
           <button onClick={onAdminLogin} className="flex items-center gap-4 p-6 bg-slate-900 text-white rounded-[2rem] shadow-xl hover:bg-black transition-all group">
              <ShieldCheck className="w-8 h-8 text-zonzamas-orange" />
              <div className="text-left">
                <p className="text-[10px] font-black uppercase opacity-40">Acceso Gestión</p>
                <p className="text-lg font-comic uppercase">ADMINISTRADOR</p>
              </div>
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[4rem] shadow-2xl border border-slate-200 overflow-hidden animate-in slide-in-from-right duration-700">
        <div className="bg-zonzamas-blue p-12 text-white text-center relative overflow-hidden">
           <Zap className="w-20 h-20 mx-auto mb-4 text-zonzamas-orange relative z-10" />
           <h3 className="text-4xl font-comic uppercase relative z-10">ZONA DE COMBATE</h3>
           <div className="absolute top-0 right-0 p-10 opacity-10"><Target className="w-64 h-64" /></div>
        </div>
        <div className="p-12 space-y-8">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Correo Electrónico de Registro</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-6 bg-slate-50 border-2 rounded-3xl outline-none focus:border-zonzamas-blue transition-all font-bold text-slate-600" placeholder="ejemplo@correo.com" />
          </div>
          <button onClick={()=>onLogin(email)} className="w-full bg-zonzamas-blue text-white p-6 rounded-3xl font-black text-2xl shadow-2xl hover:bg-zonzamas-orange hover:-translate-y-1 transition-all uppercase">ACCEDER AL DESAFÍO</button>
          <div className="relative py-4"><div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div><div className="relative flex justify-center text-[10px] font-black uppercase"><span className="bg-white px-4 text-slate-300">¿Nuevo equipo?</span></div></div>
          <button onClick={onRegisterTeam} className="w-full text-xs font-black zonzamas-orange uppercase tracking-widest hover:underline">REGISTRAR NUEVO ESCUADRÓN</button>
        </div>
      </div>
    </div>
  );
};

const VoterRegisterView = ({ onRegister, onBack }: any) => {
  const [form, setForm] = useState({ name: '', email: '', role: 'Ciclo Formativo' as CollectiveType, agreed: false });
  return (
    <div className="max-w-md mx-auto bg-white p-12 rounded-[4rem] shadow-2xl border-4 border-zonzamas-blue mt-10">
      <h2 className="text-4xl font-comic zonzamas-blue uppercase text-center mb-8">REGISTRO DE USUARIO</h2>
      <div className="space-y-6">
        <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl" placeholder="Nombre Completo" />
        <input value={form.email} onChange={e=>setForm({...form, email: e.target.value})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl" placeholder="Tu correo electrónico" />
        <select value={form.role} onChange={e=>setForm({...form, role: e.target.value as CollectiveType})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl font-bold text-slate-600">
          <option value="Ciclo Formativo">Alumnado</option>
          <option value="Cuerpo Docente">Docente</option>
          <option value="PAS (Administración/Servicios)">PAS</option>
          <option value="Votante Externo">Votante Externo</option>
        </select>
        <label className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
          <input type="checkbox" checked={form.agreed} onChange={e=>setForm({...form, agreed: e.target.checked})} className="mt-1 w-5 h-5 rounded" />
          <span className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase">Acepto el tratamiento de mis datos personales exclusivamente para este concurso del CIFP Zonzamas (LOPD).</span>
        </label>
        <button onClick={()=>{ if(form.agreed && form.name && form.email) onRegister(form.name, form.email, form.role); else alert("Debes rellenar los datos y aceptar la LOPD"); }} className="w-full bg-zonzamas-blue text-white p-6 rounded-2xl font-black text-xl shadow-xl hover:bg-zonzamas-orange transition-all uppercase">FINALIZAR REGISTRO</button>
        <button onClick={onBack} className="w-full text-xs font-black text-slate-400 uppercase mt-4 hover:text-slate-600 transition-colors">Volver</button>
      </div>
    </div>
  );
};

const AdminLoginView = ({ onLogin, onBack }: any) => {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  return (
    <div className="max-w-md mx-auto bg-white p-12 rounded-[3rem] shadow-2xl border-4 border-slate-900 mt-10 animate-in zoom-in duration-300">
      <div className="text-center mb-8"><ShieldCheck className="w-16 h-16 mx-auto mb-4 text-slate-900" /><h2 className="text-3xl font-comic zonzamas-blue uppercase tracking-tight">CENTRO DE CONTROL</h2></div>
      <div className="space-y-4">
        <input type="text" placeholder="Usuario" value={u} onChange={e=>setU(e.target.value)} className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-slate-900" />
        <input type="password" placeholder="Contraseña" value={p} onChange={e=>setP(e.target.value)} className="w-full p-4 bg-slate-50 border-2 rounded-2xl outline-none focus:border-slate-900" />
        <button onClick={()=>onLogin(u,p)} className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-colors">ACCEDER</button>
        <button onClick={onBack} className="w-full text-xs font-black text-slate-400 uppercase mt-4 hover:text-slate-600">Cancelar</button>
      </div>
    </div>
  );
};

const DashboardView = ({ state, phase, onNavigate }: any) => {
  const s = state.currentScenario;
  if (!s) return <div className="text-center p-32"><Loader2 className="animate-spin mx-auto w-16 h-16 text-zonzamas-blue" /><p className="mt-4 font-comic text-2xl zonzamas-blue">SINTONIZANDO SEÑAL IA...</p></div>;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-zonzamas-blue p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl border-b-8 border-zonzamas-orange transform -rotate-1">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-4">
               <span className="bg-zonzamas-orange px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">RETO Nº {s.number}</span>
               <span className="bg-white/10 px-6 py-2 rounded-full text-xs font-black uppercase border border-white/20">{s.educationalCycle}</span>
            </div>
            <h2 className="text-8xl font-comic leading-[0.9] uppercase">{s.mainTopic}</h2>
            <div className="p-8 bg-white/5 rounded-3xl border border-white/10 flex gap-6 backdrop-blur-sm">
              <div className="bg-zonzamas-orange p-3 rounded-xl h-fit shadow-md"><Info className="w-6 h-6 text-white" /></div>
              <p className="text-lg text-blue-50 font-medium italic leading-relaxed">"{s.subTopic}"</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 p-20 opacity-10 pointer-events-none rotate-12"><Activity className="w-[30rem] h-[30rem]" /></div>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-10 rounded-[3rem] border-2 border-slate-100 shadow-xl flex flex-col items-center justify-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-2 bg-zonzamas-orange"></div>
              <Clock className="w-10 h-10 text-zonzamas-orange mb-4 group-hover:rotate-12 transition-transform" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Plazo de Entrega:</p>
              <p className="text-4xl font-comic zonzamas-blue tabular-nums">{phase.countdown}</p>
              <p className="text-[10px] font-bold text-slate-300 uppercase mt-4">Cierre de Entrega: Domingo 23:59:59</p>
           </div>
           <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl flex flex-col items-center justify-center text-center group border-b-8 border-blue-500">
              <Calendar className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Estado de Votos:</p>
              <p className="text-2xl font-comic uppercase text-blue-400">{phase.isVotingPeriod ? '¡ABIERTAS!' : 'PRÓXIMO LUNES'}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase mt-4">Votaciones: Lun y Mar tras el reto</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(['text', 'image', 'video'] as const).map(type => {
          const c = s.challenges[type];
          const Icon = type === 'text' ? MessageSquare : type === 'image' ? ImageIcon : Video;
          return (
            <div key={type} className="bg-white rounded-[3rem] p-10 border-2 border-slate-100 shadow-xl flex flex-col group hover:-translate-y-2 transition-all">
              <div className="bg-slate-50 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-8 border-2 border-slate-50 group-hover:bg-zonzamas-blue group-hover:text-white transition-all shadow-inner"><Icon className="w-10 h-10" /></div>
              <h4 className="font-comic text-3xl zonzamas-blue mb-2 uppercase tracking-tighter">MODALIDAD {type}</h4>
              <p className="text-xs font-black text-zonzamas-orange uppercase mb-6 tracking-widest">{c.title}</p>
              <p className="text-slate-500 text-sm leading-relaxed mb-10 flex-1 italic font-medium">"{c.description}"</p>
              <button onClick={()=>onNavigate('submit')} disabled={!state.currentTeam} className="w-full bg-zonzamas-blue text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-zonzamas-orange shadow-lg transition-all disabled:opacity-30 disabled:grayscale">ENVIAR SOLUCIÓN</button>
              {!state.currentTeam && <p className="text-[9px] font-bold text-slate-300 uppercase text-center mt-3">Solo para Equipos Registrados</p>}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button onClick={()=>onNavigate('gallery')} className="p-12 bg-white border-4 border-zonzamas-blue rounded-[3.5rem] shadow-xl flex items-center justify-between group hover:bg-blue-50 transition-all">
          <div className="text-left"><span className="block text-[10px] font-black zonzamas-blue uppercase opacity-60 mb-2">Zona de Usuarios</span><span className="text-4xl font-comic zonzamas-blue uppercase">GALERÍA Y VOTACIONES</span></div>
          <Star className={`w-12 h-12 transition-transform ${phase.canVote ? 'text-zonzamas-orange animate-pulse' : 'text-zonzamas-blue group-hover:scale-125'}`} />
        </button>
        <button onClick={()=>onNavigate('ranking')} className="p-12 bg-slate-900 text-white rounded-[3.5rem] shadow-xl flex items-center justify-between group hover:bg-black transition-all">
          <div className="text-left"><span className="block text-[10px] font-black uppercase opacity-40 mb-2">Clasificación</span><span className="text-4xl font-comic uppercase">SALÓN DE MAESTROS</span></div>
          <BarChart3 className="w-12 h-12 group-hover:rotate-12 transition-transform text-zonzamas-orange" />
        </button>
      </div>
    </div>
  );
};

const RegisterView = ({ onRegister, onBack }: any) => {
  const [form, setForm] = useState({ name: '', collective: 'Ciclo Formativo' as CollectiveType, departmentOrCycle: '', captainEmail: '', members: [] as string[], agreed: false });
  const [newMember, setNewMember] = useState('');
  return (
    <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3.5rem] shadow-2xl border-t-8 border-zonzamas-orange animate-in zoom-in duration-500">
      <div className="flex justify-between items-start mb-10 border-b-2 border-slate-50 pb-8">
        <div>
          <h2 className="text-5xl font-comic zonzamas-blue uppercase tracking-tight leading-none">REGISTRO DE ESCUADRÓN</h2>
          <p className="text-[13px] font-black text-zonzamas-orange uppercase tracking-widest mt-3">Idea original de Diego Martín Suárez</p>
        </div>
        <img src="https://www.cifpzonzamas.es/img/logol.webp" alt="Logo" className="h-14 drop-shadow-sm" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-zonzamas-blue font-bold text-slate-600" placeholder="Nombre del Equipo" />
          <select value={form.collective} onChange={e=>setForm({...form, collective: e.target.value as CollectiveType})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl font-bold text-slate-500">
            <option value="Ciclo Formativo">Ciclo Formativo</option>
            <option value="Cuerpo Docente">Cuerpo Docente</option>
            <option value="PAS (Administración/Servicios)">PAS</option>
          </select>
          <input value={form.departmentOrCycle} onChange={e=>setForm({...form, departmentOrCycle: e.target.value})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-zonzamas-blue font-bold text-slate-600" placeholder="Ciclo o Departamento" />
        </div>
        <div className="space-y-6">
          <input value={form.captainEmail} onChange={e=>setForm({...form, captainEmail: e.target.value})} className="w-full p-5 bg-slate-50 border-2 rounded-2xl outline-none focus:border-zonzamas-blue font-bold text-slate-600" placeholder="Email del Capitán/a (para acceso)" />
          <div className="flex gap-2">
            <input value={newMember} onChange={e=>setNewMember(e.target.value)} className="flex-1 p-5 bg-slate-50 border-2 rounded-2xl font-bold text-slate-600" placeholder="Nombre de integrante" />
            <button onClick={() => { if(newMember && form.members.length < 5) { setForm({...form, members: [...form.members, newMember]}); setNewMember(''); } }} className="bg-slate-900 text-white px-8 rounded-2xl font-black text-xl hover:bg-black">+</button>
          </div>
          <div className="flex flex-wrap gap-2 min-h-[60px] p-2 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
            {form.members.map(m => <span key={m} className="bg-blue-600 text-white text-[11px] font-black px-4 py-2 rounded-full border border-blue-700 shadow-sm">{m}</span>)}
            {form.members.length === 0 && <span className="text-[10px] text-slate-300 font-bold uppercase m-auto">Añade hasta 5 miembros</span>}
          </div>
        </div>
      </div>
      <label className="flex items-start gap-4 mt-12 p-8 bg-slate-50 rounded-[2.5rem] cursor-pointer hover:bg-slate-100 transition-all border-2 border-slate-100">
        <input type="checkbox" checked={form.agreed} onChange={e=>setForm({...form, agreed: e.target.checked})} className="mt-1 w-6 h-6 rounded accent-zonzamas-blue" />
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">Confirmo que los datos son veraces y acepto el tratamiento de mi información personal conforme a la LOPD para este entorno educativo del CIFP Zonzamas.</span>
      </label>
      <div className="flex gap-6 mt-12">
        <button onClick={onBack} className="flex-1 p-6 font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">VOLVER</button>
        <button onClick={()=>{ if(form.agreed && form.name && form.captainEmail) onRegister(form); else alert("Completa los campos obligatorios y acepta la LOPD"); }} className="flex-1 bg-zonzamas-orange text-white p-6 rounded-2xl font-black text-2xl shadow-xl hover:scale-[1.03] active:scale-95 transition-all uppercase">FINALIZAR ALTA</button>
      </div>
    </div>
  );
};

const SubmitView = ({ scenario, onCancel, onSubmit }: any) => {
  const [data, setData] = useState({ type: RoundType.TEXT, url: '', ai: '', prompt: '', structure: '' });
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-200">
      <div className="bg-zonzamas-orange p-10 text-white flex justify-between items-center shadow-md">
        <h2 className="text-4xl font-comic uppercase tracking-tight">ENTREGA DE TRABAJO</h2>
        <button onClick={onCancel} className="p-3 hover:bg-white/20 rounded-full transition-colors"><Home /></button>
      </div>
      <div className="p-12 space-y-8">
         <div className="grid grid-cols-3 gap-6">
           {(['text', 'image', 'video'] as const).map(t => (
             <button key={t} onClick={()=>setData({...data, type: t as RoundType})} className={`p-5 rounded-3xl font-black text-[11px] transition-all border-4 flex flex-col items-center gap-2 ${data.type === t ? 'bg-zonzamas-blue border-zonzamas-blue text-white shadow-xl scale-105' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
               MODALIDAD {t.toUpperCase()}
             </button>
           ))}
         </div>
         <div className="space-y-6">
            <input value={data.url} onChange={e=>setData({...data, url: e.target.value})} className="p-5 bg-slate-50 border-2 rounded-2xl w-full font-bold text-slate-600 outline-none focus:border-zonzamas-blue" placeholder="Enlace al trabajo (Drive/YouTube/Canva...)" />
            <input value={data.ai} onChange={e=>setData({...data, ai: e.target.value})} className="p-5 bg-slate-50 border-2 rounded-2xl w-full font-bold text-slate-600 outline-none focus:border-zonzamas-blue" placeholder="¿Qué Herramienta de IA has utilizado?" />
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Prompt Completo</label>
              <textarea value={data.prompt} onChange={e=>setData({...data, prompt: e.target.value})} className="w-full p-6 bg-slate-900 text-green-400 border-2 rounded-[2.5rem] h-48 font-mono text-sm shadow-inner outline-none focus:ring-4 focus:ring-green-400/20" placeholder="Pega aquí el prompt maestro..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Metodología / Estructura</label>
              <textarea value={data.structure} onChange={e=>setData({...data, structure: e.target.value})} className="w-full p-6 bg-slate-50 border-2 rounded-[2rem] h-32 text-sm font-medium text-slate-600 outline-none focus:border-zonzamas-blue" placeholder="Explica brevemente cómo estructuraste el prompt..." />
            </div>
         </div>
         <div className="flex gap-6 pt-6">
            <button onClick={onCancel} className="flex-1 p-6 font-black text-slate-400 uppercase hover:text-slate-600 transition-colors">CANCELAR</button>
            <button onClick={()=>data.url && data.prompt && onSubmit(data)} className="flex-1 bg-zonzamas-blue text-white p-6 rounded-2xl font-black text-2xl shadow-2xl hover:bg-zonzamas-orange hover:-translate-y-1 active:scale-95 transition-all uppercase">ENVIAR A VALORACIÓN</button>
         </div>
      </div>
    </div>
  );
};

const GalleryView = ({ state, phase, onVote, onBack }: any) => {
  // Las votaciones son sobre el reto que acaba de terminar (el anterior en el historial)
  const activeChallengeId = state.historyScenarios.length > 0 
    ? state.historyScenarios[state.historyScenarios.length - 1].id 
    : state.currentScenario?.id;
    
  const activeChallengeNum = state.historyScenarios.length > 0 
    ? state.historyScenarios[state.historyScenarios.length - 1].number 
    : state.currentScenario?.number;

  const subs = state.submissions.filter((s: Submission) => s.challengeId === activeChallengeId);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div>
          <h2 className="text-7xl font-comic zonzamas-blue uppercase leading-none tracking-tight">GALERÍA DE PROMPTS</h2>
          <div className="flex items-center gap-4 mt-3">
            <span className="bg-zonzamas-orange text-white px-5 py-1.5 rounded-full text-[11px] font-black uppercase shadow-sm">Votando Reto Nº {activeChallengeNum}</span>
            {!phase.canVote && <span className="text-red-500 text-[10px] font-black uppercase flex items-center gap-2 bg-red-50 px-4 py-1.5 rounded-full border border-red-100"><Lock className="w-3 h-3" /> Votaciones Cerradas (Solo Lun-Mar)</span>}
          </div>
        </div>
        <button onClick={onBack} className="bg-white px-10 py-5 rounded-full shadow-xl font-black text-zonzamas-blue border-2 border-slate-100 flex items-center gap-3 hover:bg-slate-50 transition-all uppercase text-xs tracking-widest"><ArrowLeft className="w-5 h-5" /> REGRESAR</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {subs.length === 0 ? (
          <div className="col-span-full p-40 text-center border-4 border-dashed border-slate-200 rounded-[5rem] bg-white/50 backdrop-blur-sm">
            <p className="font-comic text-4xl text-slate-300 uppercase">SIN ENTREGAS PARA ESTE RETO TODAVÍA</p>
          </div>
        ) : subs.map((s: Submission) => {
          const voterVotesForThisChallenge = state.currentVoter?.votes[activeChallengeId!] || {};
          const catVote = voterVotesForThisChallenge[s.type];
          const hasVotedThis = catVote === s.id;
          
          return (
            <div key={s.id} className="bg-white rounded-[4rem] shadow-2xl overflow-hidden border-2 border-slate-100 flex flex-col group hover:scale-[1.02] transition-all">
              <div className="aspect-[16/10] bg-slate-900 flex items-center justify-center p-12 relative group-hover:bg-zonzamas-blue transition-colors duration-500">
                 <div className="absolute top-8 left-8 bg-zonzamas-orange text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{s.type}</div>
                 <a href={s.productUrl} target="_blank" className="bg-white text-zonzamas-blue px-10 py-4 rounded-2xl font-black text-xs shadow-2xl hover:scale-110 transition-transform uppercase tracking-widest">VER RESULTADO</a>
                 <div className="absolute bottom-8 right-8 bg-white/10 text-white px-6 py-2 rounded-full text-sm font-black backdrop-blur-md border border-white/20 shadow-lg">⭐ {s.votes} Votos</div>
              </div>
              <div className="p-10 flex-1 flex flex-col">
                 <h3 className="font-comic text-4xl zonzamas-blue mb-2 uppercase tracking-tight">{s.teamName}</h3>
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-6 tracking-widest border-l-4 border-zonzamas-orange pl-3">{s.collective}</p>
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] text-[11px] flex-1 mb-10 overflow-y-auto max-h-48 border border-slate-100 shadow-inner">
                    <p className="font-black text-zonzamas-orange uppercase mb-2 tracking-widest text-[9px]">Ingeniería de Prompt:</p>
                    <p className="text-slate-600 italic font-medium leading-relaxed">"{s.methodology.prompts}"</p>
                 </div>
                 <button 
                  onClick={()=>onVote(s.id, s.type)} 
                  disabled={!phase.canVote || !!catVote} 
                  className={`w-full p-6 rounded-3xl font-black text-xs flex items-center justify-center gap-3 shadow-xl transition-all uppercase tracking-widest ${hasVotedThis ? 'bg-green-500 text-white' : !!catVote ? 'bg-slate-100 text-slate-300 opacity-50 cursor-not-allowed' : !phase.canVote ? 'bg-slate-50 text-slate-200' : 'bg-zonzamas-blue text-white hover:bg-zonzamas-orange active:scale-95'}`}
                 >
                   {hasVotedThis ? <><CheckCircle className="w-5 h-5" /> TU VOTO</> : !!catVote ? <><Lock className="w-5 h-5" /> CATEGORÍA VOTADA</> : !phase.canVote ? 'VOTOS CERRADOS' : <><Star className="w-5 h-5" /> VOTAR {s.type.toUpperCase()}</>}
                 </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RankingView = ({ teams, onBack }: any) => {
  const sorted = [...teams].sort((a,b)=>b.totalWins - a.totalWins);
  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="flex justify-between items-center border-b-4 border-slate-100 pb-6">
        <h2 className="text-7xl font-comic zonzamas-blue uppercase leading-none tracking-tight">SALÓN DE LA FAMA</h2>
        <button onClick={onBack} className="font-black text-slate-400 hover:text-zonzamas-blue transition-colors uppercase text-xs tracking-widest bg-white px-6 py-3 rounded-full shadow-sm border border-slate-50">Cerrar</button>
      </div>
      <div className="bg-white rounded-[5rem] shadow-2xl border-2 border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
            <tr><th className="p-12">Rango</th><th className="p-12">Escuadrón</th><th className="p-12">Colectivo</th><th className="p-12 text-right">Trofeos</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sorted.map((t, i) => (
              <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-12"><div className={`w-16 h-16 rounded-2xl flex items-center justify-center font-comic text-3xl shadow-xl ${i===0?'bg-yellow-400 text-white scale-110 rotate-3': i===1?'bg-slate-300 text-white' : i===2 ? 'bg-orange-400 text-white' : 'bg-slate-100 text-slate-400'}`}>{i+1}</div></td>
                <td className="p-12 font-comic text-5xl zonzamas-blue uppercase tracking-tight">{t.name}</td>
                <td className="p-12 text-[11px] font-black text-slate-400 uppercase tracking-widest">{t.collective}</td>
                <td className="p-12 text-right font-comic text-8xl zonzamas-orange drop-shadow-md">{t.totalWins}</td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={4} className="p-40 text-center text-slate-200 font-comic text-4xl uppercase">TABLÓN DE ANUNCIOS VACÍO</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminPanel = ({ state, onGenerate, setBaseChallenge, onBack }: any) => {
  const [forcedNum, setForcedNum] = useState(state.baseChallengeNumber);
  
  // Auditoría completa de votos para el administrador
  const voteLogs = state.voters.flatMap(v => 
    Object.entries(v.votes).flatMap(([cid, cats]) => 
      Object.entries(cats).map(([cat, subId]) => ({
        voter: v.name,
        email: v.email,
        role: v.role,
        challenge: cid,
        category: cat,
        submission: state.submissions.find(s => s.id === subId)?.teamName || 'Desconocido'
      }))
    )
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b-2 border-slate-100 pb-8">
        <div className="flex items-center gap-6">
          <button onClick={onBack} className="p-4 bg-white rounded-full shadow-lg hover:bg-slate-50 transition-all active:scale-90 border border-slate-100 text-slate-400"><LogOut /></button>
          <h2 className="text-6xl font-comic zonzamas-blue uppercase tracking-tighter">SALA DE SITUACIÓN</h2>
        </div>
        <div className="bg-white p-5 rounded-[2.5rem] border-2 border-slate-100 shadow-xl flex items-center gap-8">
           <div className="flex items-center gap-4">
             <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest">Base de Retos:</span>
             <input type="number" value={forcedNum} onChange={e=>{
               const val = parseInt(e.target.value);
               setForcedNum(val);
               setBaseChallenge(val);
             }} className="w-20 p-3 bg-slate-50 border-2 rounded-2xl font-black text-center text-xl zonzamas-blue outline-none focus:border-zonzamas-orange" />
           </div>
           <button onClick={()=>onGenerate(forcedNum)} className="bg-zonzamas-blue text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase shadow-lg hover:bg-zonzamas-orange transition-all active:scale-95 flex items-center gap-2">
             <RotateCcw className="w-4 h-4" /> REGENERAR RETO ACTUAL
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-2 border-slate-100">
           <h4 className="font-comic text-4xl zonzamas-blue uppercase mb-10 border-b-2 border-zonzamas-orange pb-4 inline-block">CICLO DE OPERACIONES</h4>
           <div className="space-y-8">
              <div className="flex justify-between items-center p-8 bg-slate-50 rounded-[3rem] border border-slate-100">
                 <div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Misión Activa:</p>
                   <p className="text-5xl font-comic zonzamas-blue">Nº {state.currentScenario?.number || '-'}</p>
                 </div>
                 <button onClick={()=>onGenerate()} className="bg-zonzamas-orange text-white px-10 py-4 rounded-[2rem] font-black text-xs uppercase shadow-2xl hover:scale-105 active:scale-95 transition-all">PROGRAMAR N+1</button>
              </div>
              <div className="p-8 border-2 border-dashed border-slate-200 rounded-[3rem] bg-slate-50/30">
                <p className="text-[11px] font-black text-slate-400 uppercase mb-6 text-center tracking-[0.2em]">Temporizador de Sistema</p>
                <ul className="text-[12px] font-bold text-slate-500 space-y-4 uppercase tracking-tight">
                  <li className="flex justify-between items-center"><span>Reinicio Automático:</span> <span className="text-zonzamas-orange bg-orange-50 px-4 py-1 rounded-full border border-orange-100 font-black">DOM 23:59:59</span></li>
                  <li className="flex justify-between items-center"><span>Plazo de Entrega:</span> <span className="text-zonzamas-blue bg-blue-50 px-4 py-1 rounded-full border border-blue-100 font-black">LUN a DOM</span></li>
                  <li className="flex justify-between items-center"><span>Ventana de Votos:</span> <span className="text-green-500 bg-green-50 px-4 py-1 rounded-full border border-green-100 font-black">LUN y MAR</span></li>
                </ul>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden flex flex-col justify-center border-b-[1rem] border-zonzamas-orange">
           <Trophy className="w-20 h-20 mb-8 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
           <div className="grid grid-cols-3 gap-10">
              <div><p className="text-[11px] font-black uppercase opacity-40 tracking-widest mb-2">Equipos</p><p className="text-7xl font-comic leading-none">{state.teams.length}</p></div>
              <div><p className="text-[11px] font-black uppercase opacity-40 tracking-widest mb-2">Votantes</p><p className="text-7xl font-comic leading-none">{state.voters.length}</p></div>
              <div><p className="text-[11px] font-black uppercase opacity-40 tracking-widest mb-2">Votos</p><p className="text-7xl font-comic leading-none text-zonzamas-orange">{voteLogs.length}</p></div>
           </div>
           <div className="absolute -bottom-20 -right-20 opacity-5 rotate-12"><Users className="w-72 h-72" /></div>
        </div>
      </div>

      <div className="bg-white rounded-[5rem] shadow-2xl border-2 border-slate-100 overflow-hidden mt-10">
        <div className="p-12 bg-slate-50 border-b-2 flex justify-between items-center">
          <h4 className="font-comic text-4xl zonzamas-blue uppercase tracking-tight">AUDITORÍA DE ACTIVIDAD</h4>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Registro en Tiempo Real</span>
        </div>
        <div className="max-h-[30rem] overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest sticky top-0 z-10">
              <tr><th className="p-8">Votante Identificado</th><th className="p-8">Rol / Email</th><th className="p-8">ID Reto</th><th className="p-8">Categoría</th><th className="p-8">Objetivo del Voto</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {voteLogs.map((log, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-8 text-zonzamas-blue font-black text-base uppercase">{log.voter}</td>
                  <td className="p-8">
                    <span className="block font-black uppercase text-[9px] text-slate-400 mb-1">{log.role}</span>
                    <span className="block font-medium text-slate-300 italic">{log.email}</span>
                  </td>
                  <td className="p-8 font-mono text-slate-400 text-[11px] font-bold">{log.challenge}</td>
                  <td className="p-8">
                    <span className="uppercase font-black text-[10px] bg-orange-100 text-zonzamas-orange px-4 py-1.5 rounded-full border border-orange-200">
                      {log.category}
                    </span>
                  </td>
                  <td className="p-8 font-comic text-2xl text-slate-600 uppercase tracking-tight">{log.submission}</td>
                </tr>
              ))}
              {voteLogs.length === 0 && <tr><td colSpan={5} className="p-40 text-center text-slate-200 font-comic text-4xl uppercase">SIN REGISTROS DE VOTO ACTUALMENTE</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
