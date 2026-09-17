import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Landing } from "./pages/Landing";
import { HeartPulse, Loader2 } from "lucide-react";

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const AppLoadingFallback: React.FC = () => {
  const [showSkip, setShowSkip] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-clinical-alabaster flex flex-col justify-center items-center px-4">
      <HeartPulse className="h-12 w-12 text-clinical-blue animate-pulse mb-4" />
      <div className="flex items-center gap-2 text-clinical-slate font-semibold text-sm">
        <Loader2 className="h-4 w-4 animate-spin text-clinical-blue" />
        Initializing HealthLens AI...
      </div>
      {showSkip && (
        <a
          href="/login"
          className="mt-4 inline-flex items-center gap-1.5 text-xs text-clinical-blue bg-white px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm hover:bg-blue-50 font-medium transition-all"
        >
          Click to proceed to Login / Demo &rarr;
        </a>
      )}
    </div>
  );
};

// Guard component to protect private dashboard routes
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={<Landing />}
            />
            <Route
              path="/login"
              element={<Login />}
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
