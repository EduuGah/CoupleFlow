import React, { Component, ErrorInfo, ReactNode } from 'react';
import { HeartCrack, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <HeartCrack size={40} />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">Ops, algo deu errado!</h1>
          <p className="text-stone-500 mb-8 max-w-md">
            Tivemos um pequeno tropeço ao carregar esta tela. Não se preocupe, os dados do casal estão a salvo.
          </p>
          <button
            onClick={this.handleReload}
            className="flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors shadow-sm"
          >
            <RefreshCw size={18} />
            Recarregar aplicativo
          </button>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
