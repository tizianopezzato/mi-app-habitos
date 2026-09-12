import Dexie, { Table } from 'dexie';

export interface UserProfile {
  id?: number;
  name: string;
  weight: number; // en kg
  height: number; // en cm
  goal: 'muscle_gain' | 'fat_loss' | 'maintenance';
  workoutLocation: 'home' | 'gym';
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface Subject {
  id?: number;
  name: string;
  examDate: string; // YYYY-MM-DD
  topics: string[];
}

export interface TaskClaim {
  id?: number;
  taskId: string; // Identificador único de la tarea
  date: string;   // YYYY-MM-DD
  claimed: boolean;
}

export interface MealLog {
  id?: number;
  date: string;
  breakfast: boolean;
  lunch: boolean;
  snack: boolean;
  dinner: boolean;
  waterGlasses: number;
}

export interface DailyStats {
  id?: number;
  date: string; // YYYY-MM-DD
  xpEarned: number;
  studyMinutes: number;
}

export interface QuickNote {
  id?: number;
  text: string;
  completed: boolean;
  createdAt: string; // YYYY-MM-DD
}

export class AppDatabase extends Dexie {
  userProfile!: Table<UserProfile>;
  subjects!: Table<Subject>;
  taskClaims!: Table<TaskClaim>;
  mealLogs!: Table<MealLog>;
  dailyStats!: Table<DailyStats>;
  quickNotes!: Table<QuickNote>;

  constructor() {
    super('HabitosEstudioDB');
    this.version(7).stores({
      userProfile: '++id',
      subjects: '++id, name, examDate',
      taskClaims: '++id, taskId, date, [taskId+date]',
      mealLogs: '++id, date',
      dailyStats: '++id, date',
      quickNotes: '++id, createdAt, completed'
    });
  }
}

export const db = new AppDatabase();