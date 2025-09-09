
import React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/App";
import Documents from "./pages/Documents";
import Portfolio from "./pages/Portfolio";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";

const queryClient = new QueryClient();

const ErrorFallback = ({ error }: { error: Error }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold text-destructive mb-4">
          Une erreur s'est produite
        </h1>
        <p className="text-muted-foreground mb-4">
          Nous nous excusons pour ce problème technique.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90"
        >
          Recharger la page
        </button>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-muted-foreground">
              Détails de l'erreur (développement)
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/app" element={<Dashboard />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/portfolio" element={<Portfolio />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
