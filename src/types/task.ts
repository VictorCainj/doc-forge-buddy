export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  subtitle: string;
  description: string;
  observacao: string;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CreateTaskInput {
  title: string;
  subtitle?: string;
  description: string;
  observacao?: string;
  status?: TaskStatus;
}

export interface UpdateTaskInput {
  title?: string;
  subtitle?: string;
  description?: string;
  observacao?: string;
  status?: TaskStatus;
}

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Não Iniciada',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
};

export const TASK_STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'default',
  in_progress: 'warning',
  completed: 'success',
};

// Sistema de Níveis e EXP
export interface UserLevel {
  level: number;
  title: string;
  minExp: number;
  maxExp: number;
  color: string;
  icon: string;
}

export const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    title: 'Iniciante',
    minExp: 0,
    maxExp: 99,
    color: 'text-gray-600',
    icon: '🌱',
  },
  {
    level: 2,
    title: 'Aprendiz',
    minExp: 100,
    maxExp: 199,
    color: 'text-blue-600',
    icon: '📚',
  },
  {
    level: 3,
    title: 'Competente',
    minExp: 200,
    maxExp: 299,
    color: 'text-green-600',
    icon: '⚡',
  },
  {
    level: 4,
    title: 'Experiente',
    minExp: 300,
    maxExp: 399,
    color: 'text-purple-600',
    icon: '🔥',
  },
  {
    level: 5,
    title: 'Mestre',
    minExp: 400,
    maxExp: 499,
    color: 'text-orange-600',
    icon: '👑',
  },
  {
    level: 6,
    title: 'Lenda',
    minExp: 500,
    maxExp: Infinity,
    color: 'text-yellow-600',
    icon: '⭐',
  },
];

export const EXP_PER_TASK = 10;

export function getLevelInfo(level: number): UserLevel {
  return USER_LEVELS[level - 1] || USER_LEVELS[0];
}

export function calculateLevel(exp: number): number {
  return Math.max(1, Math.floor(exp / 100) + 1);
}

export function getExpForNextLevel(currentExp: number): number {
  const currentLevel = calculateLevel(currentExp);
  return currentLevel * 100;
}

export function getExpProgress(currentExp: number): {
  currentLevelExp: number;
  nextLevelExp: number;
  progress: number;
} {
  const level = calculateLevel(currentExp);
  const currentLevelMinExp = (level - 1) * 100;
  const nextLevelExp = level * 100;
  const currentLevelExp = currentExp - currentLevelMinExp;
  const progress = (currentLevelExp / 100) * 100;

  return {
    currentLevelExp,
    nextLevelExp: 100,
    progress,
  };
}
