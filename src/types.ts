export const DEFAULT_CATEGORIES = [
  'Assistir',
  'Comer',
  'Visitar',
  'Fazer',
  'Viajar',
  'Comprar',
  'Ler',
  'Ouvir',
  'Outros'
] as const;

export type PlanCategory = typeof DEFAULT_CATEGORIES[number] | string;
export type PlanStatus = 'quero_fazer' | 'planejado' | 'fizemos';
export type PlanPriority = 'baixa' | 'media' | 'alta';

export interface Plan {
  id: string;
  couple_id: string;
  created_by_id: string;
  title: string;
  description: string | null;
  category: PlanCategory;
  status: PlanStatus;
  priority: PlanPriority;
  planned_date: string | null;
  completed_at: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlanComment {
  id: string;
  plan_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface PlanPhoto {
  id: string;
  plan_id: string;
  user_id: string;
  storage_path: string;
  created_at: string;
}
