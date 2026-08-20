import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F5F7FA]">
          <div className="bg-white rounded-2xl border border-gray-100 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-[#C62828]/10 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-[#C62828]" />
            </div>
            <h1 className="text-lg font-black text-gray-900">Algo salió mal</h1>
            <p className="text-xs text-gray-500 leading-relaxed">
              Ha ocurrido un error inesperado. Por favor, intenta recargar la página.
            </p>
            {this.state.error && (
              <div className="p-3 bg-gray-50 rounded-xl text-left">
                <p className="text-[10px] font-mono text-gray-500 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-[#622599] hover:bg-[#4a1c75] text-white rounded-xl text-xs font-bold flex items-center gap-2 mx-auto transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recargar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
