import { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-md w-full">
            <CardContent className="flex flex-col items-center text-center py-10 space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-7 w-7 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                Algo correu mal
              </h2>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro inesperado. Por favor, tente recarregar a página ou voltar ao início.
              </p>
              {this.state.error && (
                <pre className="text-xs text-muted-foreground bg-muted rounded-lg p-3 max-w-full overflow-auto text-left">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={this.handleReset}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Tentar novamente
                </Button>
                <Button onClick={this.handleGoHome}>
                  <Home className="mr-2 h-4 w-4" />
                  Ir para o Início
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
