import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useCouple } from '../contexts/CoupleContext';
import { Loader2 } from 'lucide-react';

export function RequireCoupleRoute() {
  const { couple, loadingCouple } = useCouple();
  const location = useLocation();

  if (loadingCouple) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!couple) {
    // Passa a rota atual para o setup para podermos voltar se necessário,
    // mas o principal é forçar a ir para o setup
    return <Navigate to="/setup" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
