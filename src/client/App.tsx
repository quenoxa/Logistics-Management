import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';

// Pages
import { Login } from './pages/Login';
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

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-orange-600 animate-spin"></div>
          <span className="text-xs font-medium text-slate-500">Loading workspace...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 lg:p-7 max-w-7xl w-full mx-auto">
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
  if (user?.role === 'FLEET_MANAGER') {
    return <FleetDashboard />;
  }
  return <Dashboard />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
