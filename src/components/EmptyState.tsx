import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-stone-50 rounded-2xl border border-stone-100">
      <div className="text-stone-300 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-stone-800 mb-2">{title}</h3>
      <p className="text-stone-500 max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
