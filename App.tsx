
import React, { useState, useEffect } from 'react';
import { View, Team, Scenario, Submission, RoundType, GameState, Voter, CollectiveType } from './types';
import { generateWeeklyChallenge } from './services/geminiService';
import { 
  Activity, Trophy, Users, Target, Send, BarChart3, 
  LogIn, LogOut, Loader2, Zap, MessageSquare, 
  Image as ImageIcon, Video, Star, ShieldCheck, 
  Home, ArrowLeft, Info, CheckCircle, Clock, 
  Calendar, Lock, UserCheck, RotateCcw, Plus
} from 'lucide-react';

const ADMIN_CREDENTIALS = { user: 'admin_zonzamas', pass: 'Zonzamas2025' };

const App: React.FC = () => {
  const [state, setState] = useState<GameState>(() => {
    const saved = localStorage.getItem('zonzamas_ai_battle_v2');
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
    localStorage.setItem('zonzamas_ai_battle_v2', JSON.stringify(state));
  }, [state]);

  const getPhaseInfo = () => {
    const now = currentTime;
    const day = now.getDay(); // 0: Dom, 1: Lun, 2: Mar...
    const isVotingPeriod = day === 1 || day === 2;
    const nextSunday = new Date(now);
    nextSunday.setDate(now.getDate() + (day === 0 ? 0 : 7 - day));
    nextSunday.setHours(23, 59, 59, 999);
    const diff = nextSunday.getTime() - now.getTime();
    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / 1000 / 60) % 60);
    const s = Math.floor((diff / 1000) % 60);
    return { isVotingPeriod, countdown: `${d}d ${h}h ${m}m ${s}s`, canVote: isVotingPeriod };
  };

  const phase = getPhaseInfo();

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const nextNum = (state.currentScenario?.number || 0) + 1;
      const week = Math.ceil(currentTime.getDate() / 7);
      const challenge = await generateWeeklyChallenge(week, nextNum);
      setState(prev => ({ 
        ...prev, 
        currentScenario: challenge,
        historyScenarios: prev.currentScenario ? [...prev.historyScenarios, prev.currentScenario] : prev.historyScenarios
      }));
      alert("¡Nuevo reto generado con éxito!");
    } catch (e) {
      alert("Error al conectar con la IA de Google. Revisa tu API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderView = () => {
    switch (state.view) {
      case 'login': return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center py-10 animate-in fade-in zoom-in duration-500">
          <div className="space-y-6">
            <span className="text-zonzamas-orange font-black text-xs uppercase tracking-widest animate-pulse">Idea original de Diego Martín Suárez</span>
            <h2 className="text-7xl font-comic zonzamas-blue leading-none uppercase">LA BATALLA DE LOS <span className="text-zonzamas-orange">PROMPTS</span></h2>
            <p className="text-lg text-slate-500 italic">"Domina la IA Generativa en el CIFP Zonzamas."</p>
            <div className="flex flex-wrap gap-4 pt-6">
              <button onClick={() => setState(p=>({...p, view: 'voter-register'}))} className="bg-white border-2 border-slate-100 p-4 rounded-2xl font-comic text-zonzamas-blue shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                <UserCheck className="w-5 h-5" /> REGISTRARME PARA VOTAR
              </button>
              <button onClick={() => setState(p=>({...p, view: 'admin-login'}))} className="bg-slate-800 text-white p-4 rounded-2xl font-comic shadow-lg hover:bg-black flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-zonzamas-orange" /> ADMINISTRACIÓN
              </button>
            </div>
          </div>
          <div className="bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-slate-100 relative overflow-hidden halftone-pattern">
            <div className="relative z-10">
              <h3 className="text-3xl font-comic zonzamas-blue mb-8 text-center uppercase">ACCESO AL ARENA</h3>
              <input 
                type="email" 
                className="w-full p-4 bg-slate-50 border-2 rounded-2xl mb-6 font-bold focus:border-zonzamas-blue outline-none transition-all" 
                placeholder="Tu email registrado" 
                id="login-email"
              />
              <button 
                onClick={() => {
                  const email = (document.getElementById('login-email') as HTMLInputElement).value;
                  const voter = state.voters.find(v => v.email.toLowerCase() === email.toLowerCase());
                  if (!voter) return alert("Email no registrado. Regístrate como votante o equipo primero.");
                  const team = state.teams.find(t => t.captainEmail.toLowerCase() === email.toLowerCase());
                  setState(p => ({ ...p, currentVoter: voter, currentTeam: team || null, view: 'dashboard' }));
                }}
                className="w-full bg-zonzamas-blue text-white p-5 rounded-2xl font-comic text-2xl shadow-xl hover:bg-zonzamas-orange transition-colors"
              >
                ENTRAR
              </button>
              <button onClick={() => setState(p=>({...p, view: 'register-team'}))} className="w-full mt-6 text-xs font-black text-zonzamas-orange uppercase hover:underline text-center block">
                ¿ERES UN EQUIPO? REGÍSTRATE AQUÍ
              </button>
            </div>
          </div>
        </div>
      );

      case 'voter-register': return (
        <div className="max-w-md mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-zonzamas-blue animate-in slide-in-from-bottom duration-500">
          <h2 className="text-3xl font-comic zonzamas-blue text-center mb-6 uppercase">REGISTRO DE VOTANTE</h2>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nombre Completo</label>
              <input id="reg-name" placeholder="Ej. Juan Pérez" className="w-full p-4 border-2 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Institucional</label>
              <input id="reg-email" placeholder="usuario@cifpzonzamas.es" className="w-full p-4 border-2 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Colectivo</label>
              <select id="reg-role" className="w-full p-4 border-2 rounded-xl bg-white">
                <option>Ciclo Formativo</option>
                <option>Cuerpo Docente</option>
                <option>PAS (Administración/Servicios)</option>
              </select>
            </div>
            <button 
              onClick={() => {
                const n = (document.getElementById('reg-name') as HTMLInputElement).value;
                const e = (document.getElementById('reg-email') as HTMLInputElement).value;
                const r = (document.getElementById('reg-role') as HTMLSelectElement).value as CollectiveType;
                if (!n || !e) return alert("Rellena todos los campos");
                const newVoter: Voter = { id: Math.random().toString(36).substr(2, 9), name: n, email: e, role: r, votes: {} };
                setState(prev => ({ ...prev, voters: [...prev.voters, newVoter], currentVoter: newVoter, view: 'dashboard' }));
              }}
              className="w-full bg-zonzamas-blue text-white p-4 rounded-xl font-comic text-xl shadow-lg hover:bg-zonzamas-orange"
            >
              CREAR CUENTA
            </button>
            <button onClick={() => setState(p=>({...p, view:'login'}))} className="w-full text-xs font-black text-slate-300 uppercase hover:text-slate-500 transition-colors">Volver</button>
          </div>
        </div>
      );

      case 'admin-login': return (
        <div className="max-w-md mx-auto bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl border-t-8 border-zonzamas-orange">
          <h2 className="text-3xl font-comic text-center mb-8 uppercase tracking-widest text-zonzamas-orange">ACCESO RESTRINGIDO</h2>
          <div className="space-y-6">
            <input id="admin-user" placeholder="Usuario" className="w-full p-4 bg-slate-800 border-none rounded-xl text-white" />
            <input id="admin-pass" type="password" placeholder="Contraseña" className="w-full p-4 bg-slate-800 border-none rounded-xl text-white" />
            <button 
              onClick={() => {
                const u = (document.getElementById('admin-user') as HTMLInputElement).value;
                const p = (document.getElementById('admin-pass') as HTMLInputElement).value;
                if (u === ADMIN_CREDENTIALS.user && p === ADMIN_CREDENTIALS.pass) {
                  setState(prev => ({ ...prev, isAdminAuthenticated: true, view: 'admin' }));
                } else {
                  alert("Credenciales incorrectas");
                }
              }}
              className="w-full bg-zonzamas-orange text-white p-4 rounded-xl font-comic text-xl shadow-lg"
            >
              AUTENTICAR
            </button>
            <button onClick={() => setState(p=>({...p, view:'login'}))} className="w-full text-xs font-black text-slate-500 uppercase">Volver</button>
          </div>
        </div>
      );

      case 'dashboard': return (
        <div className="space-y-10 animate-in fade-in duration-500">
          <div className="bg-zonzamas-blue p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <span className="bg-zonzamas-orange px-4 py-1 rounded-full text-[10px] font-black uppercase">Reto Actual</span>
              {state.currentScenario ? (
                <>
                  <h2 className="text-6xl font-comic mt-4 uppercase">{state.currentScenario.mainTopic}</h2>
                  <p className="text-blue-100 italic mt-2">"{state.currentScenario.subTopic}"</p>
                  <div className="mt-8 flex gap-4">
                    <span className="bg-white/20 p-2 rounded-lg text-xs font-bold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-zonzamas-orange" /> {state.currentScenario.educationalCycle}
                    </span>
                  </div>
                </>
              ) : (
                <h2 className="text-4xl font-comic mt-4 uppercase">ESPERANDO NUEVO RETO...</h2>
              )}
            </div>
            <div className="absolute top-0 right-0 p-10 opacity-10"><Activity className="w-40 h-40" /></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-3xl border-2 shadow-xl text-center">
              <Clock className="mx-auto text-zonzamas-orange mb-2 w-10 h-10" />
              <p className="text-[10px] font-black text-slate-400 uppercase">Tiempo restante</p>
              <p className="text-3xl font-comic zonzamas-blue">{phase.countdown}</p>
            </div>
            <button onClick={()=>setState(p=>({...p, view:'gallery'}))} className="bg-white p-8 rounded-3xl border-2 shadow-xl hover:scale-105 transition-all text-center group">
              <Star className="mx-auto text-zonzamas-blue mb-2 w-10 h-10 group-hover:rotate-12 transition-transform" />
              <p className="font-comic text-2xl zonzamas-blue uppercase">GALERÍA Y VOTOS</p>
              <p className="text-[9px] font-black uppercase text-slate-400">{phase.isVotingPeriod ? '¡ABIERTAS LUN/MAR!' : 'CERRADO (SOLO LUN/MAR)'}</p>
            </button>
            <div className="bg-zonzamas-orange p-8 rounded-3xl shadow-xl text-white text-center">
              <Trophy className="mx-auto mb-2 w-10 h-10" />
              <p className="text-[10px] font-black uppercase opacity-60">Tu Puntuación</p>
              <p className="text-3xl font-comic">{state.currentTeam?.totalWins || 0} VICTORIAS</p>
            </div>
          </div>
        </div>
      );

      case 'admin': return (
        <div className="space-y-10">
          <div className="flex justify-between items-center">
            <h2 className="text-5xl font-comic zonzamas-blue uppercase">PANEL DE CONTROL</h2>
            <button onClick={() => setState(p=>({...p, isAdminAuthenticated: false, view: 'login'}))} className="bg-white p-4 rounded-2xl shadow-lg border-2 hover:bg-red-50 group">
              <LogOut className="group-hover:text-red-500" />
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2 halftone-pattern relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="font-comic text-3xl zonzamas-blue mb-6 flex items-center gap-3">
                  <Zap className="text-zonzamas-orange" /> GESTIÓN DE RETOS
                </h3>
                <p className="text-slate-500 mb-8 text-sm">Cada vez que pulses este botón, la IA de Google generará 3 nuevos desafíos técnicos basados en un ciclo formativo aleatorio del centro.</p>
                <button 
                  onClick={handleGenerate} 
                  disabled={isLoading}
                  className="w-full bg-zonzamas-orange text-white p-6 rounded-2xl font-comic text-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin" /> : <Plus />}
                  {isLoading ? 'GENERANDO...' : 'GENERAR RETO SEMANAL'}
                </button>
              </div>
            </div>
            
            <div className="bg-white p-10 rounded-[3rem] shadow-xl border-2">
              <h3 className="font-comic text-3xl zonzamas-blue mb-6 flex items-center gap-3">
                <Users className="text-zonzamas-blue" /> ESTADÍSTICAS
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-400 text-xs uppercase">Equipos Registrados</span>
                  <span className="font-comic text-2xl zonzamas-blue">{state.teams.length}</span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-400 text-xs uppercase">Votantes Activos</span>
                  <span className="font-comic text-2xl zonzamas-blue">{state.voters.length}</span>
                </div>
                <div className="flex justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="font-bold text-slate-400 text-xs uppercase">Soluciones Enviadas</span>
                  <span className="font-comic text-2xl zonzamas-blue">{state.submissions.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

      case 'gallery': return (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-5xl font-comic zonzamas-blue uppercase">LA GALERÍA</h2>
            <button onClick={() => setState(p=>({...p, view:'dashboard'}))} className="bg-white p-4 rounded-full shadow-lg border-2"><ArrowLeft /></button>
          </div>
          <div className="bg-blue-50 border-2 border-zonzamas-blue p-6 rounded-3xl text-center">
            <p className="text-zonzamas-blue font-bold">
              {phase.isVotingPeriod 
                ? "¡EL PERIODO DE VOTACIÓN ESTÁ ABIERTO! Elige tus favoritos." 
                : "LA GALERÍA ESTÁ EN MODO LECTURA. Solo se puede votar Lunes y Martes."}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-10">
            {state.submissions.length === 0 ? (
              <div className="col-span-full text-center py-20 opacity-20 italic">
                <MessageSquare className="mx-auto w-20 h-20 mb-4" />
                <p className="text-3xl font-comic">AÚN NO HAY ENTREGAS QUE MOSTRAR</p>
              </div>
            ) : (
              state.submissions.map(sub => (
                <div key={sub.id} className="bg-white rounded-3xl overflow-hidden shadow-lg border-2 hover:border-zonzamas-orange transition-all">
                  <div className="h-48 bg-slate-200 flex items-center justify-center">
                    {sub.type === RoundType.IMAGE ? <ImageIcon className="w-20 h-20 text-white" /> : <Video className="w-20 h-20 text-white" />}
                  </div>
                  <div className="p-6">
                    <h4 className="font-comic text-2xl zonzamas-blue uppercase">{sub.teamName}</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase mt-1">{sub.collective}</p>
                    <div className="mt-6 flex justify-between items-center">
                      <span className="font-comic text-3xl text-zonzamas-orange">{sub.votes} VOTOS</span>
                      {phase.isVotingPeriod && (
                        <button 
                          onClick={() => {
                            setState(prev => ({
                              ...prev,
                              submissions: prev.submissions.map(s => s.id === sub.id ? {...s, votes: s.votes + 1} : s)
                            }));
                          }}
                          className="bg-zonzamas-blue text-white px-4 py-2 rounded-xl font-comic hover:bg-zonzamas-orange transition-colors"
                        >
                          ¡VOTAR!
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      );

      default: return <div className="text-center p-20 font-comic text-2xl">Cargando aplicación...</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans selection:bg-zonzamas-orange selection:text-white">
      <nav className="bg-white border-b-4 border-zonzamas-orange px-6 py-4 sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setState(p=>({...p, view: state.currentVoter ? 'dashboard' : 'login'}))}>
            <img src="https://www.cifpzonzamas.es/img/logol.webp" alt="Logo Zonzamas" className="h-10" />
            <h1 className="font-comic text-2xl zonzamas-blue uppercase hidden md:block">ZONZAMAS AI BATTLE</h1>
          </div>
          <div className="flex items-center gap-6">
             {state.currentVoter && (
               <div className="text-right hidden sm:block">
                 <p className="text-[10px] font-black uppercase text-slate-400">Sesión de</p>
                 <p className="font-bold text-xs zonzamas-blue">{state.currentVoter.name}</p>
               </div>
             )}
             {state.currentVoter && (
               <button onClick={() => setState(p=>({...p, currentVoter:null, currentTeam:null, view:'login'}))} className="text-slate-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full">
                 <LogOut className="w-5 h-5" />
               </button>
             )}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        {renderView()}
      </main>

      <footer className="bg-slate-900 text-white p-8 border-t-8 border-zonzamas-blue mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-left space-y-2">
            <div className="flex items-center gap-2">
               <img src="https://www.cifpzonzamas.es/img/logol.webp" alt="Logo" className="h-6 grayscale brightness-200" />
               <p className="text-xs font-black text-blue-400 uppercase">CIFP Zonzamas • Lanzarote</p>
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Proyecto de Gamificación e IA Generativa</p>
          </div>
          <div className="text-center md:text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase">Idea Original y Coordinación</p>
            <p className="font-comic text-xl text-zonzamas-orange">DIEGO MARTÍN SUÁREZ</p>
          </div>
          <div className="opacity-20 flex gap-4">
             <Star className="w-4 h-4" />
             <Zap className="w-4 h-4" />
             <Target className="w-4 h-4" />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
