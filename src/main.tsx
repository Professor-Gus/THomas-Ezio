import React, { StrictMode, Component, ErrorInfo, ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import ThomasApp from './thomas/ThomasApp.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class RootErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[Projeto Thomas System Error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#040b07] text-emerald-50 flex flex-col items-center justify-center p-6 text-center font-mono select-none">
          <div className="max-w-md w-full bg-[#07150d] border border-emerald-500/40 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4">
            <div className="text-xs font-semibold tracking-wider uppercase text-[#39FF14]">
              Projeto Thomas · Amazônia Viva
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-emerald-50">
              Recuperação do Aplicativo
            </h1>

            <p className="text-xs text-emerald-200/80 leading-relaxed">
              Ocorreu uma instabilidade temporária ao carregar o painel de monitoramento.
            </p>

            {this.state.error && (
              <div className="w-full bg-[#040b07] border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-200 text-left overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-2.5 px-4 bg-[#22c55e] hover:bg-[#39FF14] text-[#031208] rounded-lg text-xs font-bold uppercase cursor-pointer transition-colors"
            >
              Recarregar Aplicativo
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <RootErrorBoundary>
        <ThomasApp />
      </RootErrorBoundary>
    </StrictMode>,
  );
}
