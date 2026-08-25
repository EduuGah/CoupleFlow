export type Category = 'Filmes' | 'Restaurantes' | 'Viagens' | 'Tarefas' | 'Outros';

export type PlanStatus = 'pendente' | 'concluido';

export interface PlanItem {
  id: string;
  title: string;
  description?: string;
  category: Category;
  status: PlanStatus;
  createdAt: string;
}

export interface CoupleProfile {
  partner1Name: string;
  partner2Name: string;
  anniversaryDate: string;
}
