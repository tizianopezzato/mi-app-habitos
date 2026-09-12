'use client';

import React, { useState, useEffect } from 'react';
import { db, UserProfile, Subject, TaskClaim, MealLog, DailyStats, QuickNote } from '@/app/lib/db';
import { 
  Target, 
  Zap, 
  BookOpen, 
  Utensils, 
  Moon, 
  Trophy, 
  Play, 
  CheckCircle2, 
  Circle,
  Plus, 
  Calendar, 
  Clock, 
  Trash2, 
  Droplet, 
  ChefHat, 
  Sparkles,
  Dumbbell,
  ShieldAlert,
  Award,
  Flame,
  BarChart3,
  TrendingUp,
  Activity,
  StickyNote,
  Quote
} from 'lucide-react';

// Sistema de Rangos
const RANKS = [
  { minLevel: 1, title: 'Novato', badge: '🌱', desc: 'Construyendo cimientos de disciplina.' },
  { minLevel: 5, title: 'Estudiante de Sistemas', badge: '💻', desc: 'Optimizando rutinas y algoritmos de estudio.' },
  { minLevel: 10, title: 'Ingeniero en Potencia', badge: '⚡', desc: 'Alto rendimiento académico y físico.' },
  { minLevel: 20, title: 'Máster de Hábitos', badge: '👑', desc: 'Ejecución impecable sin fricción.' }
];

// Colección de Frases Motivadoras Diarias
const MOTIVATIONAL_QUOTES = [
  "Persigue tus sueños con ejecución implacable.",
  "La disciplina vence a la motivación en cualquier escenario.",
  "Construye hoy el futuro que deseas liderar mañana.",
  "El éxito es la suma de pequeñas victorias diarias repetidas.",
  "Tu único límite es la excusa que decides creerte.",
  "Enfócate en el proceso y los resultados llegarán solos.",
  "Cada hora de estudio y entreno es una inversión en tu mejor versión.",
  "No pares cuando estés cansado, para cuando hayas terminado.",
  "Domina tu mente y dominarás tus resultados.",
  "Pequeños hábitos constantes construyen imperios.",
  "La constancia transforma el esfuerzo ordinario en resultados extraordinarios.",
  "Visualiza tu meta y no te desvíes del camino.",
  "Hazlo hoy, tu 'yo' del futuro te lo agradecerá.",
  "El trabajo duro en silencio dejará que tu éxito haga el ruido.",
  "No busques comodidad, busca superación diaria.",
  "Controla tus días antes de que tus días te controlen a ti.",
  "La excelencia no es un acto, es un hábito diario.",
  "Crea la disciplina que tu visión requiere.",
  "Menos excusas, más ejecución quirúrgica.",
  "Lo que haces hoy define en quién te convertirás mañana."
];

export default function Home() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'study' | 'nutrition' | 'stats' | 'night'>('dashboard');
  
  // Perfil del Usuario
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Tizi',
    weight: 70,
    height: 175,
    goal: 'muscle_gain',
    workoutLocation: 'gym',
    xp: 0,
    level: 1,
    streak: 1,
    lastActiveDate: new Date().toISOString().split('T')[0]
  });

  // Temporizador / Modo Enfoque
  const [focusMode, setFocusMode] = useState(false);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Módulo Estudios
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newExamDate, setNewExamDate] = useState('');
  const [newTopics, setNewTopics] = useState('');

  // Módulo Notas Rápidas
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  // Registro de Cobros Anti-Exploit
  const [claimedTaskIds, setClaimedTaskIds] = useState<Set<string>>(new Set());

  // Módulo Nutrición
  const [meals, setMeals] = useState({ breakfast: false, lunch: false, snack: false, dinner: false });
  const [water, setWater] = useState(0);
  const [ingredients, setIngredients] = useState('');
  const [generatedMenu, setGeneratedMenu] = useState<{ [key: string]: { name: string; prep: string } } | null>(null);

  // Módulo Cierre de Día
  const [nightSteps, setNightSteps] = useState({ screens: false, plan: false, relax: false });

  // Módulo Estadísticas Semanales
  const [weeklyStats, setWeeklyStats] = useState<{ day: string; date: string; xp: number }[]>([]);

  // Carga inicial desde IndexedDB
  useEffect(() => {
    initData();
  }, []);

  const initData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Cargar o crear Perfil
      let userProf = await db.userProfile.toCollection().first();
      if (!userProf) {
        const defaultProfile: UserProfile = {
          name: 'Tizi',
          weight: 70,
          height: 175,
          goal: 'muscle_gain',
          workoutLocation: 'gym',
          xp: 0,
          level: 1,
          streak: 1,
          lastActiveDate: today
        };
        const id = await db.userProfile.add(defaultProfile);
        userProf = { ...defaultProfile, id };
      }
      setProfile(userProf);

      // Cargar Materias
      const loadedSubjects = await db.subjects.toArray();
      setSubjects(loadedSubjects);

      // Cargar Notas Rápidas
      const loadedNotes = await db.quickNotes.toArray();
      setNotes(loadedNotes);

      // Cargar Reclamos del Día (Anti-Exploit)
      const claimsToday: TaskClaim[] = await db.taskClaims.where('date').equals(today).toArray();
      const claimedSet = new Set(claimsToday.filter((c: TaskClaim) => c.claimed).map((c: TaskClaim) => c.taskId));
      setClaimedTaskIds(claimedSet);

      // Cargar Comidas del Día
      const mealToday = await db.mealLogs.where('date').equals(today).first();
      if (mealToday) {
        setMeals({
          breakfast: mealToday.breakfast,
          lunch: mealToday.lunch,
          snack: mealToday.snack,
          dinner: mealToday.dinner
        });
        setWater(mealToday.waterGlasses);
      }

      // Cargar Estadísticas Semanales
      await loadWeeklyStats();
    } catch (error) {
      console.error('Error cargando datos de Dexie:', error);
    }
  };

  const loadWeeklyStats = async () => {
    const daysName = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = daysName[d.getDay()];

      const stat = await db.dailyStats.where('date').equals(dateStr).first();
      result.push({
        day: dayLabel,
        date: dateStr,
        xp: stat ? stat.xpEarned : 0
      });
    }

    setWeeklyStats(result);
  };

  // Frase Motivadora Diaria (Cambia automáticamente cada 24hs según la fecha)
  const getDailyQuote = () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % MOTIVATIONAL_QUOTES.length;
    return MOTIVATIONAL_QUOTES[index];
  };

  // Guardar Cambios de Perfil
  const saveProfile = async (updated: Partial<UserProfile>) => {
    const newProf = { ...profile, ...updated };
    setProfile(newProf);
    if (newProf.id) {
      await db.userProfile.update(newProf.id, newProf);
    }
  };

  // Lógica Anti-Exploit para Reclamar XP
  const claimXP = async (taskId: string, amount: number) => {
    const today = new Date().toISOString().split('T')[0];

    const existing = await db.taskClaims.where({ taskId, date: today }).first();
    if (existing && existing.claimed) {
      return;
    }

    if (existing && existing.id) {
      await db.taskClaims.update(existing.id, { claimed: true });
    } else {
      await db.taskClaims.add({ taskId, date: today, claimed: true });
    }

    setClaimedTaskIds(prev => new Set(prev).add(taskId));

    const currentDailyStat = await db.dailyStats.where('date').equals(today).first();
    if (currentDailyStat && currentDailyStat.id) {
      await db.dailyStats.update(currentDailyStat.id, { xpEarned: currentDailyStat.xpEarned + amount });
    } else {
      await db.dailyStats.add({ date: today, xpEarned: amount, studyMinutes: 0 });
    }

    let newXp = profile.xp + amount;
    let newLevel = profile.level;
    const requiredXp = newLevel * 100;

    if (newXp >= requiredXp) {
      newXp -= requiredXp;
      newLevel += 1;
    }

    saveProfile({ xp: newXp, level: newLevel });
    await loadWeeklyStats();
  };

  // Rango Actual
  const currentRank = [...RANKS].reverse().find(r => profile.level >= r.minLevel) || RANKS[0];

  // Cálculo Dinámico de las 5 CLAVES NO NEGOCIABLES
  const getDynamicCoreTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    const tasks = [];

    // Clave 1: Estudio Urgente
    const sortedSubjects = [...subjects]
      .filter(s => new Date(s.examDate) >= new Date(today))
      .sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime());

    if (sortedSubjects.length > 0) {
      const closest = sortedSubjects[0];
      const days = Math.max(1, Math.ceil((new Date(closest.examDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
      tasks.push({
        id: `study-priority-${today}`,
        title: `Estudiar ${closest.name}`,
        subtitle: `Examen en ${days} días. Repasar: ${closest.topics[0] || 'Temario principal'}`,
        xp: 30
      });
    } else {
      tasks.push({
        id: `study-generic-${today}`,
        title: `Bloque de Lógica / Programación`,
        subtitle: `Completar 45 minutos de estudio técnico enfocado.`,
        xp: 25
      });
    }

    // Clave 2: Nutrición y Salud
    const proteinTarget = Math.round(profile.weight * 2);
    tasks.push({
      id: `nutrition-target-${today}`,
      title: `Plan de Comidas (${profile.goal === 'muscle_gain' ? 'Volumen Muscular' : 'Mantenimiento'})`,
      subtitle: `Asegurar aporte calórico y ~${proteinTarget}g de proteína diaria.`,
      xp: 20
    });

    // Clave 3: Entrenamiento / Movilidad
    tasks.push({
      id: `workout-target-${today}`,
      title: `Sesión de Entrenar (${profile.workoutLocation === 'gym' ? 'Gimnasio' : 'Casa/Calistenia'})`,
      subtitle: `Completar rutina de hipertrofia o movilidad intensa.`,
      xp: 25
    });

    // Clave 4 y 5: Integración Dinámica de Notas Personales Pendientes
    const activeNotes = notes.filter(n => !n.completed);
    if (activeNotes.length > 0) {
      tasks.push({
        id: `note-task-${activeNotes[0].id}-${today}`,
        title: `Nota: ${activeNotes[0].text}`,
        subtitle: `Tarea personal pendiente agendada.`,
        xp: 15
      });
    } else {
      tasks.push({
        id: `habit-water-${today}`,
        title: `Meta de Hidratación (2.5L de Agua)`,
        subtitle: `Completar los 8 vasos de agua del día.`,
        xp: 15
      });
    }

    if (activeNotes.length > 1) {
      tasks.push({
        id: `note-task-${activeNotes[1].id}-${today}`,
        title: `Nota: ${activeNotes[1].text}`,
        subtitle: `Tarea personal pendiente agendada.`,
        xp: 15
      });
    } else {
      tasks.push({
        id: `sleep-prep-${today}`,
        title: `Cierre Nocturno a las 23:00`,
        subtitle: `Apagar pantallas 1h antes para optimizar descanso.`,
        xp: 20
      });
    }

    return tasks;
  };

  // Gestión de Notas Rápidas
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const today = new Date().toISOString().split('T')[0];
    const newNote: QuickNote = {
      text: newNoteText.trim(),
      completed: false,
      createdAt: today
    };

    const id = await db.quickNotes.add(newNote);
    setNotes(prev => [...prev, { ...newNote, id }]);
    setNewNoteText('');
  };

  const toggleNote = async (id?: number) => {
    if (!id) return;
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const updatedStatus = !note.completed;
    await db.quickNotes.update(id, { completed: updatedStatus });
    setNotes(prev => prev.map(n => n.id === id ? { ...n, completed: updatedStatus } : n));
  };

  const handleDeleteNote = async (id?: number) => {
    if (!id) return;
    await db.quickNotes.delete(id);
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  // Bloques de Estudio Quirúrgico
  const getStudyBlocks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...subjects]
      .map(sub => {
        const exam = new Date(sub.examDate);
        const diffDays = Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
        let hoursPerDay = 1.5;
        let urgencyColor = 'border-emerald-500/40 bg-gradient-to-b from-neutral-900 via-neutral-900 to-emerald-950/20';
        let urgencyBadge = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

        if (diffDays <= 3) {
          hoursPerDay = 4.5;
          urgencyColor = 'border-red-500/50 bg-gradient-to-b from-neutral-900 via-neutral-900 to-red-950/30';
          urgencyBadge = 'bg-red-500/10 text-red-400 border-red-500/30';
        } else if (diffDays <= 7) {
          hoursPerDay = 2.5;
          urgencyColor = 'border-amber-500/50 bg-gradient-to-b from-neutral-900 via-neutral-900 to-amber-950/20';
          urgencyBadge = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
        }

        const topicsCount = Math.max(1, sub.topics.length);
        const topicsPerDay = Math.ceil(topicsCount / diffDays);

        return {
          ...sub,
          daysLeft: diffDays,
          recommendedHours: hoursPerDay,
          todaysTopics: sub.topics.slice(0, topicsPerDay),
          urgencyColor,
          urgencyBadge
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName || !newExamDate) return;
    const topicsArray = newTopics.split(',').map(t => t.trim()).filter(Boolean);
    const newSub: Subject = { name: newSubjectName, examDate: newExamDate, topics: topicsArray };
    
    const id = await db.subjects.add(newSub);
    setSubjects(prev => [...prev, { ...newSub, id }]);
    setNewSubjectName('');
    setNewExamDate('');
    setNewTopics('');
  };

  const handleDeleteSubject = async (id?: number) => {
    if (!id) return;
    await db.subjects.delete(id);
    setSubjects(prev => prev.filter(s => s.id !== id));
  };

  // Control Temporizador
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
      claimXP(`focus-session-${Date.now()}`, 50);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  // Comidas y Agua
  const toggleMeal = async (type: keyof typeof meals) => {
    const updated = !meals[type];
    const newMeals = { ...meals, [type]: updated };
    setMeals(newMeals);

    const today = new Date().toISOString().split('T')[0];
    const existing = await db.mealLogs.where('date').equals(today).first();

    if (existing && existing.id) {
      await db.mealLogs.update(existing.id, { ...newMeals, waterGlasses: water });
    } else {
      await db.mealLogs.add({ date: today, ...newMeals, waterGlasses: water });
    }

    if (updated) {
      claimXP(`meal-${type}-${today}`, 15);
    }
  };

  const updateWater = async (delta: number) => {
    const newWater = Math.max(0, water + delta);
    setWater(newWater);

    const today = new Date().toISOString().split('T')[0];
    const existing = await db.mealLogs.where('date').equals(today).first();

    if (existing && existing.id) {
      await db.mealLogs.update(existing.id, { waterGlasses: newWater });
    } else {
      await db.mealLogs.add({ date: today, ...meals, waterGlasses: newWater });
    }

    if (delta > 0) {
      claimXP(`water-${newWater}-${today}`, 5);
    }
  };

  // Motor Culinario
  const generateRecipeIdea = () => {
    if (!ingredients.trim()) {
      setGeneratedMenu(null);
      return;
    }

    const raw = ingredients.toLowerCase();
    const hasEgg = raw.includes('huevo');
    const hasMilk = raw.includes('leche');
    const hasFlour = raw.includes('harina') || raw.includes('avena');
    const hasChicken = raw.includes('pollo') || raw.includes('carne') || raw.includes('atun') || raw.includes('atún');
    const hasRice = raw.includes('arroz') || raw.includes('fideos') || raw.includes('papa');

    let menu = {
      desayuno: {
        name: 'Omelette de Claras/Huevos con Infusión',
        prep: 'Bate 2-3 huevos en un bowl con sal. Vierte en sartén antiadherente caliente con un chorrito de aceite a fuego medio 3 min por lado.'
      },
      almuerzo: {
        name: 'Plato Proteico Salteado',
        prep: 'Cocina los ingredientes principales a la sartén con un chorro de aceite de oliva o manteca para sumar calorías de calidad.'
      },
      merienda: {
        name: 'Huevos Revueltos / Bowl Proteico',
        prep: 'Cocina a fuego lento en sartén revolviendo con espátula 2 minutos hasta lograr consistencia cremosa.'
      },
      cena: {
        name: 'Cena Ligera de Reparación',
        prep: 'Saltea los ingredientes con verduras o condimentos a gusto. Cocción a fuego medio durante 8-10 minutos.'
      }
    };

    if (hasEgg && hasFlour) {
      menu.desayuno = {
        name: 'Panqueques Proteicos de Avena/Harina',
        prep: 'Mezcla 2 huevos, 4 cdas de harina/avena y un chorro de leche. Bate bien y vuelca porciones en sartén caliente 2 min por lado.'
      };
      menu.merienda = {
        name: 'Torre de Crepes / Torrejas Proteicas',
        prep: 'Prepara discos finos a la sartén con la mezcla líquida. Acompaña con miel, fruta o queso si dispones.'
      };
    }

    if (hasChicken && hasRice) {
      menu.almuerzo = {
        name: 'Bowl de Volumen (Pollo/Atún con Arroz/Papa)',
        prep: 'Cocina el arroz/papa al vapor. Saltea la proteína en sartén con aceite y mezcla todo en un bowl sumando frutos secos u oliva.'
      };
      menu.cena = {
        name: 'Salteado Chaufa Proteico',
        prep: 'En una sartén bien caliente, saltea el arroz con el pollo troceado' + (hasEgg ? ' y agrega 1 huevo revuelto al final.' : '.')
      };
    }

    setGeneratedMenu(menu);
  };

  const toggleNightStep = (step: keyof typeof nightSteps) => {
    const updated = !nightSteps[step];
    setNightSteps(prev => ({ ...prev, [step]: updated }));
    if (updated) {
      const today = new Date().toISOString().split('T')[0];
      claimXP(`night-step-${step}-${today}`, 20);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const maxWeeklyXP = Math.max(...weeklyStats.map(s => s.xp), 100);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 pb-24 md:pb-6 md:pl-64 font-sans selection:bg-emerald-500 selection:text-neutral-950">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-neutral-900/90 border-r border-neutral-800 p-4 justify-between backdrop-blur-md">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-500 to-purple-600 flex items-center justify-center text-xl shadow-md">
              {currentRank.badge}
            </div>
            <div>
              <h1 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                System Habits
              </h1>
              <p className="text-xs text-emerald-400 font-mono font-medium">{currentRank.title}</p>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5">
            <button 
              onClick={() => setActiveTab('dashboard')} 
              className={`flex items-center gap-3 p-3 rounded-xl transition font-medium text-xs ${activeTab === 'dashboard' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-800/60'}`}
            >
              <Target className="w-4 h-4" /> Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('study')} 
              className={`flex items-center gap-3 p-3 rounded-xl transition font-medium text-xs ${activeTab === 'study' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-800/60'}`}
            >
              <BookOpen className="w-4 h-4" /> Estudios
            </button>
            <button 
              onClick={() => setActiveTab('nutrition')} 
              className={`flex items-center gap-3 p-3 rounded-xl transition font-medium text-xs ${activeTab === 'nutrition' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-800/60'}`}
            >
              <Utensils className="w-4 h-4" /> Nutrición & Gym
            </button>
            <button 
              onClick={() => setActiveTab('stats')} 
              className={`flex items-center gap-3 p-3 rounded-xl transition font-medium text-xs ${activeTab === 'stats' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-neutral-400 hover:bg-neutral-800/60'}`}
            >
              <BarChart3 className="w-4 h-4" /> Estadísticas
            </button>
            <button 
              onClick={() => setActiveTab('night')} 
              className={`flex items-center gap-3 p-3 rounded-xl transition font-medium text-xs ${activeTab === 'night' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-neutral-400 hover:bg-neutral-800/60'}`}
            >
              <Moon className="w-4 h-4" /> Cierre de Día
            </button>
          </nav>
        </div>

        <div className="bg-neutral-950 p-3.5 rounded-2xl border border-neutral-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-400">Racha Actual</span>
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-amber-400" /> {profile.streak} Días
            </span>
          </div>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        
        {/* TARJETA DE RANGO Y PROGRESO XP */}
        <header className="relative overflow-hidden bg-linear-to-r from-neutral-900 via-neutral-900 to-purple-950/40 p-5 rounded-2xl border border-purple-500/20 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-neutral-800 border border-purple-500/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                {currentRank.badge}
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-purple-400 font-semibold">Evolución de Personaje</span>
                <h2 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                  {currentRank.title}
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">Niv. {profile.level}</span>
                </h2>
              </div>
            </div>

            <div className="w-full sm:w-48 space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Progreso XP</span>
                <span className="text-emerald-400 font-bold">{profile.xp} / {profile.level * 100}</span>
              </div>
              <div className="w-full bg-neutral-950 h-2.5 rounded-full overflow-hidden border border-neutral-800 p-0.5">
                <div 
                  className="bg-linear-to-r from-emerald-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((profile.xp / (profile.level * 100)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* VISTA: DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            
            {/* FRASE MOTIVADORA DIARIA */}
            <section className="bg-linear-to-r from-purple-950/40 via-neutral-900 to-neutral-900 border border-purple-500/20 p-4 rounded-2xl flex items-center gap-3 shadow-md">
              <Quote className="w-6 h-6 text-purple-400 shrink-0" />
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400 font-bold">Mentalidad de Hoy</span>
                <p className="text-xs italic text-neutral-200 font-medium mt-0.5">"{getDailyQuote()}"</p>
              </div>
            </section>

            {/* ENFOQUE RÁPIDO */}
            <section className="bg-linear-to-r from-emerald-950/60 to-neutral-900 border border-emerald-800/40 p-4.5 rounded-2xl flex items-center justify-between shadow-md">
              <div>
                <h3 className="font-bold text-sm text-emerald-300">¿Procrastinando o Bloqueado?</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Dispará un bloque quirúrgico de 15 minutos.</p>
              </div>
              <button 
                onClick={() => setFocusMode(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-lg shadow-emerald-500/20 shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Modo Enfoque
              </button>
            </section>

            {/* 5 CLAVES DINÁMICAS NO NEGOCIABLES */}
            <section className="bg-neutral-900 p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 shadow-md">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-emerald-400" /> 5 Claves Dinámicas del Día
                </h3>
                <span className="text-[10px] text-neutral-500 font-mono">Anti-Exploit Activo</span>
              </div>

              <div className="space-y-2.5">
                {getDynamicCoreTasks().map((task) => {
                  const isClaimed = claimedTaskIds.has(task.id);
                  return (
                    <div 
                      key={task.id}
                      onClick={() => claimXP(task.id, task.xp)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition cursor-pointer ${
                        isClaimed 
                          ? 'bg-neutral-950/60 border-neutral-800 text-neutral-500' 
                          : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-200 hover:border-emerald-500/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isClaimed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-400/20 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-neutral-600 shrink-0" />
                        )}
                        <div>
                          <h4 className={`text-xs font-bold ${isClaimed ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
                            {task.title}
                          </h4>
                          <p className="text-[11px] text-neutral-400 mt-0.5">{task.subtitle}</p>
                        </div>
                      </div>

                      <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg border shrink-0 ${
                        isClaimed ? 'bg-neutral-900 border-neutral-800 text-neutral-600' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      }`}>
                        +{task.xp} XP
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECCIÓN DE NOTAS Y TAREAS VARIAS */}
            <section className="bg-neutral-900 p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 shadow-md">
              <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                <StickyNote className="w-4 h-4 text-emerald-400" /> Notas & Tareas Rápidas
              </h3>
              
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="ej: Mañana tengo que limpiar, comprar atún..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </form>

              <div className="space-y-2 pt-1">
                {notes.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-2">No hay notas o tareas sueltas agendadas.</p>
                ) : (
                  notes.map((note) => (
                    <div
                      key={note.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs"
                    >
                      <div 
                        onClick={() => toggleNote(note.id)}
                        className="flex items-center gap-2.5 cursor-pointer flex-1"
                      >
                        <CheckCircle2 className={`w-4 h-4 ${note.completed ? 'text-emerald-400' : 'text-neutral-700'}`} />
                        <span className={`text-neutral-200 ${note.completed ? 'line-through text-neutral-500' : ''}`}>
                          {note.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="text-neutral-600 hover:text-red-400 p-1 transition ml-2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}

        {/* VISTA: ESTUDIOS */}
        {activeTab === 'study' && (
          <div className="space-y-6">
            
            {/* CARGA DE PARCIALES */}
            <section className="bg-neutral-900 p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 shadow-md">
              <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                <Plus className="w-4 h-4 text-emerald-400" /> Cargar Nuevo Parcial
              </h3>
              <form onSubmit={handleAddSubject} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input 
                    type="text" 
                    placeholder="Materia (ej: Análisis Matemático)" 
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                    required
                  />
                  <input 
                    type="date" 
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Temas a estudiar separados por coma (ej: Integrales, Derivadas)" 
                  value={newTopics}
                  onChange={(e) => setNewTopics(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  type="submit" 
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold p-2.5 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
                >
                  Agregar Parcial
                </button>
              </form>
            </section>

            {/* BLOQUES QUIRÚRGICOS DE ESTUDIO */}
            <section className="space-y-3">
              <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                <Calendar className="w-4 h-4 text-emerald-400" /> Bloques Quirúrgicos de Estudio
              </h3>
              
              {getStudyBlocks().length === 0 ? (
                <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-8 text-center text-neutral-500 text-xs">
                  No tenés parciales ni materias registradas en el sistema.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3.5">
                  {getStudyBlocks().map((sub) => (
                    <div 
                      key={sub.id} 
                      className={`relative overflow-hidden border rounded-2xl p-4 space-y-3 shadow-md ${sub.urgencyColor}`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full border ${sub.urgencyBadge}`}>
                            Examen en {sub.daysLeft} días
                          </span>
                          <h4 className="font-bold text-sm text-neutral-100 mt-1">{sub.name}</h4>
                          <p className="text-[11px] text-neutral-400">Fecha: {sub.examDate}</p>
                        </div>
                        <button 
                          onClick={() => handleDeleteSubject(sub.id)} 
                          className="text-neutral-500 hover:text-red-400 p-1 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="bg-neutral-950/70 rounded-xl p-3 border border-neutral-800/80 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-mono">
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" /> Dosis diaria recomendada:
                          </span>
                          <span className="text-emerald-400 font-bold">{sub.recommendedHours} Horas / Día</span>
                        </div>
                        <div className="text-xs text-neutral-300">
                          <span className="text-neutral-500 font-mono text-[11px]">Temas prioritarios de hoy:</span>
                          <p className="font-medium text-purple-300 mt-0.5">
                            {sub.todaysTopics.length > 0 ? sub.todaysTopics.join(', ') : 'Repaso general de guías y prácticos'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {/* VISTA: NUTRICIÓN Y GYM */}
        {activeTab === 'nutrition' && (
          <div className="space-y-6">
            
            {/* ONBOARDING / PERFIL FÍSICO */}
            <section className="bg-neutral-900 p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 shadow-md">
              <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                <Award className="w-4 h-4 text-emerald-400" /> Perfil Físico & Objetivos
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="text-[10px] font-mono text-neutral-400">Peso (kg)</label>
                  <input
                    type="number"
                    value={profile.weight}
                    onChange={e => saveProfile({ weight: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-400">Altura (cm)</label>
                  <input
                    type="number"
                    value={profile.height}
                    onChange={e => saveProfile({ height: Number(e.target.value) })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-1.5 text-xs text-neutral-100 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-400">Objetivo</label>
                  <select
                    value={profile.goal}
                    onChange={e => saveProfile({ goal: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none"
                  >
                    <option value="muscle_gain">Ganar M. Muscular</option>
                    <option value="fat_loss">Definición</option>
                    <option value="maintenance">Mantenimiento</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono text-neutral-400">Entrenamiento</label>
                  <select
                    value={profile.workoutLocation}
                    onChange={e => saveProfile({ workoutLocation: e.target.value as any })}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-2.5 py-1.5 text-xs text-neutral-100 focus:outline-none"
                  >
                    <option value="gym">Gimnasio</option>
                    <option value="home">Casa / Calistenia</option>
                  </select>
                </div>
              </div>
            </section>

            {/* TRACKER DE 4 COMIDAS Y AGUA */}
            <section className="bg-neutral-900 p-4.5 rounded-2xl border border-neutral-800 space-y-4 shadow-md">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                  <Utensils className="w-4 h-4 text-emerald-400" /> Registro de Comidas Diarias
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold">
                  ~{Math.round(profile.weight * 2)}g Proteína
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'breakfast', label: '🌅 Desayuno' },
                  { key: 'lunch', label: '☀️ Almuerzo' },
                  { key: 'snack', label: '🥪 Merienda' },
                  { key: 'dinner', label: '🌙 Cena' }
                ].map((item) => {
                  const isDone = meals[item.key as keyof typeof meals];
                  return (
                    <button
                      key={item.key}
                      onClick={() => toggleMeal(item.key as keyof typeof meals)}
                      className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition ${
                        isDone 
                          ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' 
                          : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:border-neutral-600'
                      }`}
                    >
                      <span>{item.label}</span>
                      <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-400' : 'text-neutral-600'}`} />
                    </button>
                  );
                })}
              </div>

              {/* Registro de Agua */}
              <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-blue-400" /> Hidratación Diaria (Vasos de Agua)
                </span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => updateWater(-1)} 
                    className="bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded-lg text-neutral-300 text-xs font-bold"
                  >
                    -
                  </button>
                  <span className="text-xs font-mono font-bold text-neutral-200">{water} / 8</span>
                  <button 
                    onClick={() => updateWater(1)} 
                    className="bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded-lg text-neutral-300 text-xs font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            {/* GENERADOR DE COMIDAS CON RECETAS COHERENTES */}
            <section className="bg-neutral-900 p-4.5 rounded-2xl border border-neutral-800 space-y-3.5 shadow-md">
              <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                <ChefHat className="w-4 h-4 text-emerald-400" /> Generador Estricto de Menú (Recetas Reales)
              </h3>
              <p className="text-xs text-neutral-400">Ingresá los ingredientes disponibles en tu heladera/alacena:</p>
              
              <div className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="ej: huevo, harina, leche, pollo, arroz" 
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-2.5 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
                <button 
                  onClick={generateRecipeIdea}
                  className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center gap-1 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Armar Menú
                </button>
              </div>

              {generatedMenu && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {Object.entries(generatedMenu).map(([meal, data]) => (
                    <div key={meal} className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-1.5">
                      <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">{meal}</span>
                      <h4 className="text-xs font-bold text-neutral-100">{data.name}</h4>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">{data.prep}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* RUTINA ADAPTATIVA */}
            <section className="bg-neutral-900 p-4.5 rounded-2xl border border-neutral-800 space-y-3 shadow-md">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                  <Dumbbell className="w-4 h-4 text-purple-400" /> Rutina Adaptada ({profile.workoutLocation === 'gym' ? 'Gimnasio' : 'Casa / Calistenia'})
                </h3>
                <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Hipertrofia
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {profile.workoutLocation === 'gym' ? (
                  <>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-200">Día 1: Push (Pecho/Tríceps)</h4>
                      <p className="text-[11px] text-neutral-400">Press Banca 4x8, Press Militar 3x10, Fondos 3xFallos.</p>
                    </div>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-200">Día 2: Pull (Espalda/Bíceps)</h4>
                      <p className="text-[11px] text-neutral-400">Dominadas 4x8, Remo con Barra 4x10, Curl Bíceps 3x12.</p>
                    </div>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-200">Día 3: Legs (Pierna)</h4>
                      <p className="text-[11px] text-neutral-400">Sentadilla 4x8, Prensa 3x12, PM Rumano 4x10.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-200">Día 1: Empuje Calistenia</h4>
                      <p className="text-[11px] text-neutral-400">Flexiones Declinadas 4x12, Pike Pushups 3x10, Dips en Silla 4x15.</p>
                    </div>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-200">Día 2: Tracción / Core</h4>
                      <p className="text-[11px] text-neutral-400">Dominadas 4x8, Remo Australiano en Mesa 4x12, Leg Raises 4x15.</p>
                    </div>
                    <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 space-y-1">
                      <h4 className="text-xs font-bold text-neutral-200">Día 3: Piernas Explosivo</h4>
                      <p className="text-[11px] text-neutral-400">Sentadillas Búlgaras 4x12, Zancadas 4x15, Gemelos 4x20.</p>
                    </div>
                  </>
                )}
              </div>
            </section>
          </div>
        )}

        {/* VISTA: ESTADÍSTICAS Y HISTORIAL */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            
            {/* GRÁFICO SEMANAL DE XP */}
            <section className="bg-neutral-900 p-5 rounded-2xl border border-neutral-800 space-y-4 shadow-md">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs text-neutral-300 flex items-center gap-2 uppercase font-mono tracking-wider">
                  <Activity className="w-4 h-4 text-emerald-400" /> Rendimiento Semanal (XP Reclamado)
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">Últimos 7 Días</span>
              </div>

              {/* BARRAS DE PROGRESO */}
              <div className="flex items-end justify-between gap-2 h-40 pt-6 px-2 border-b border-neutral-800">
                {weeklyStats.map((item, idx) => {
                  const heightPercent = Math.min(100, Math.max(10, (item.xp / maxWeeklyXP) * 100));
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.xp}
                      </span>
                      <div 
                        className="w-full bg-linear-to-t from-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 shadow-md shadow-emerald-500/10"
                        style={{ height: `${heightPercent}%` }}
                      />
                      <span className="text-[10px] font-mono text-neutral-400 mt-1">{item.day}</span>
                    </div>
                  );
                })}
              </div>

              {/* RESUMEN DE METRICAS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-400 font-mono">XP Total Semanal</span>
                  <p className="text-base font-bold text-emerald-400 font-mono">
                    {weeklyStats.reduce((acc, curr) => acc + curr.xp, 0)} XP
                  </p>
                </div>
                <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 text-center space-y-0.5">
                  <span className="text-[10px] text-neutral-400 font-mono">Días Consecutivos</span>
                  <p className="text-base font-bold text-amber-400 font-mono flex items-center justify-center gap-1">
                    <Flame className="w-4 h-4 fill-amber-400" /> {profile.streak} Días
                  </p>
                </div>
              </div>
            </section>

          </div>
        )}

        {/* VISTA: CIERRE DE DÍA */}
        {activeTab === 'night' && (
          <section className="bg-linear-to-br from-indigo-950/60 via-neutral-900 to-neutral-950 p-5 rounded-2xl border border-indigo-500/30 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">Modo Noche</span>
                <h3 className="font-bold text-sm text-neutral-100 flex items-center gap-2 mt-0.5">
                  <Moon className="w-4 h-4 text-indigo-400" /> Protocolo de Desconexión (23:00 HS)
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { key: 'screens', label: '📱 Apagar pantallas / Modo Avión activado' },
                { key: 'plan', label: '📝 Dejar organizadas las 5 tareas de mañana' },
                { key: 'relax', label: '📖 10 min de lectura física / Meditación' }
              ].map((step) => {
                const isChecked = nightSteps[step.key as keyof typeof nightSteps];
                return (
                  <div 
                    key={step.key}
                    onClick={() => toggleNightStep(step.key as keyof typeof nightSteps)}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                      isChecked
                        ? 'bg-indigo-950/50 border-indigo-800/80 text-indigo-200'
                        : 'bg-neutral-950/60 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-xs font-medium">{step.label}</span>
                    <CheckCircle2 className={`w-4 h-4 ${isChecked ? 'text-indigo-400 fill-indigo-400/20' : 'text-neutral-600'}`} />
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>

      {/* MODAL MODO ENFOQUE */}
      {focusMode && (
        <div className="fixed inset-0 bg-neutral-950/95 flex flex-col items-center justify-center p-6 z-50 backdrop-blur-md">
          <h2 className="text-xl font-bold text-neutral-100 mb-1">Modo Enfoque Quirúrgico</h2>
          <p className="text-neutral-400 text-xs mb-8 text-center max-w-xs">Elegí una sola tarea corta y ejecutá sin distracciones.</p>
          
          <div className="text-6xl font-mono font-bold text-emerald-400 mb-8 tracking-wider">{formatTime(timeLeft)}</div>
          
          <div className="flex gap-3">
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)} 
              className="bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold px-6 py-3 rounded-xl text-xs transition shadow-lg shadow-emerald-500/20"
            >
              {isTimerRunning ? 'Pausar' : 'Empezar Ya'}
            </button>
            <button 
              onClick={() => { setFocusMode(false); setIsTimerRunning(false); setTimeLeft(900); }} 
              className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold px-6 py-3 rounded-xl text-xs transition"
            >
              Salir
            </button>
          </div>
        </div>
      )}

      {/* NAVEGACIÓN INFERIOR MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-neutral-900/90 border-t border-neutral-800 flex justify-around p-2.5 z-40 backdrop-blur-md">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 ${activeTab === 'dashboard' ? 'text-emerald-400' : 'text-neutral-500'}`}>
          <Target className="w-5 h-5" /> <span className="text-[10px] font-medium">Home</span>
        </button>
        <button onClick={() => setActiveTab('study')} className={`flex flex-col items-center gap-1 ${activeTab === 'study' ? 'text-emerald-400' : 'text-neutral-500'}`}>
          <BookOpen className="w-5 h-5" /> <span className="text-[10px] font-medium">Estudios</span>
        </button>
        <button onClick={() => setActiveTab('nutrition')} className={`flex flex-col items-center gap-1 ${activeTab === 'nutrition' ? 'text-emerald-400' : 'text-neutral-500'}`}>
          <Utensils className="w-5 h-5" /> <span className="text-[10px] font-medium">Nutrición</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1 ${activeTab === 'stats' ? 'text-emerald-400' : 'text-neutral-500'}`}>
          <BarChart3 className="w-5 h-5" /> <span className="text-[10px] font-medium">Stats</span>
        </button>
        <button onClick={() => setActiveTab('night')} className={`flex flex-col items-center gap-1 ${activeTab === 'night' ? 'text-purple-400' : 'text-neutral-500'}`}>
          <Moon className="w-5 h-5" /> <span className="text-[10px] font-medium">Noche</span>
        </button>
      </nav>
    </main>
  );
}