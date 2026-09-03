import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

// Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FleetDashboard } from './pages/FleetDashboard';
import { DriverConsole } from './pages/DriverConsole';
import { Vehicles } from './pages/Vehicles';
import { Drivers } from './pages/Drivers';
import { Orders } from './pages/Orders';
import { Deliveries } from './pages/Deliveries';
import { DeliveryDetails } from './pages/DeliveryDetails';
import { LiveTracking } from './pages/LiveTracking';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Admin } from './pages/Admin';
import { Maintenance } from './pages/Maintenance';
import { Issues } from './pages/Issues';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center text-slate-800 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-3 border-slate-200 border-t-emerald-500 animate-spin"></div>
          <span className="text-xs font-bold tracking-wider text-emerald-600 uppercase">
            Initializing LOGISTIX...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-800">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-x-hidden min-h-screen">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 w-full bg-slate-50 text-slate-800 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

// Home router based on user role
const RoleHomeRouter: React.FC = () => {
  const { user } = useAuth();

  if (user?.role === 'DRIVER') {
    return <DriverConsole />;
  }
  return <Dashboard />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/signup" element={<Register />} />
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <RoleHomeRouter />
                </ProtectedLayout>
              }
            />
            <Route
              path="/fleet-dashboard"
              element={
                <ProtectedLayout>
                  <FleetDashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedLayout>
                  <DriverConsole />
                </ProtectedLayout>
              }
            />
            <Route
              path="/driver-console"
              element={
                <ProtectedLayout>
                  <DriverConsole />
                </ProtectedLayout>
              }
            />
            <Route
              path="/vehicles"
              element={
                <ProtectedLayout>
                  <Vehicles />
                </ProtectedLayout>
              }
            />
            <Route
              path="/drivers"
              element={
                <ProtectedLayout>
                  <Drivers />
                </ProtectedLayout>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedLayout>
                  <Orders />
                </ProtectedLayout>
              }
            />
            <Route
              path="/deliveries"
              element={
                <ProtectedLayout>
                  <Deliveries />
                </ProtectedLayout>
              }
            />
            <Route
              path="/deliveries/:id"
              element={
                <ProtectedLayout>
                  <DeliveryDetails />
                </ProtectedLayout>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedLayout>
                  <LiveTracking />
                </ProtectedLayout>
              }
            />
            <Route
              path="/maintenance"
              element={
                <ProtectedLayout>
                  <Maintenance />
                </ProtectedLayout>
              }
            />
            <Route
              path="/issues"
              element={
                <ProtectedLayout>
                  <Issues />
                </ProtectedLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedLayout>
                  <Reports />
                </ProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <Settings />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedLayout>
                  <Admin />
                </ProtectedLayout>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedLayout>
                  <Admin />
                </ProtectedLayout>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  );
};

export default App;
