import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/core/logger/logger';
import { Button } from '@/components/ui/button';
import { RefreshCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error in component tree', error, { errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background text-center">
          <div className="max-w-md space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight text-primary">Ops! Algo deu errado</h1>
              <p className="text-muted-foreground">
                Ocorreu um erro inesperado na aplicação. Nossa equipe técnica já foi notificada.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={this.handleReset} variant="default" className="gap-2">
                <RefreshCcw className="h-4 w-4" />
                Tentar novamente
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline" className="gap-2">
                <Home className="h-4 w-4" />
                Ir para o início
              </Button>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-8 p-4 bg-muted rounded-lg text-left overflow-auto max-h-64">
                <p className="font-mono text-xs text-destructive font-bold mb-2">Debug Error:</p>
                <pre className="font-mono text-[10px] text-muted-foreground whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
