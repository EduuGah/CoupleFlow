import { CoupleProfile, PlanItem } from './types';

export const mockCouple: CoupleProfile = {
  partner1Name: 'Edu',
  partner2Name: 'Parceiro(a)',
  anniversaryDate: '2023-06-12',
};

export const mockPlans: PlanItem[] = [
  {
    id: '1',
    title: 'Assistir Duna: Parte 2',
    category: 'Filmes',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Jantar no restaurante italiano',
    description: 'Aquele novo no centro da cidade.',
    category: 'Restaurantes',
    status: 'pendente',
    createdAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Comprar presentes de natal',
    category: 'Tarefas',
    status: 'concluido',
    createdAt: new Date().toISOString(),
  }
];
