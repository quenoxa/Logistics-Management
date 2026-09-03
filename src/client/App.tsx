import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { RoleGuard } from './components/auth/RoleGuard';
import { DriverLayout } from './components/layout/DriverLayout';

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
    return <Navigate to="/driver" replace />;
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
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <FleetDashboard />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/driver"
              element={
                <RoleGuard allowedRoles={['DRIVER']}>
                  <DriverLayout>
                    <DriverConsole />
                  </DriverLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/driver-console"
              element={<Navigate to="/driver" replace />}
            />
            <Route
              path="/vehicles"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <Vehicles />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/drivers"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <Drivers />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/orders"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <Orders />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/deliveries"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <Deliveries />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/deliveries/:id"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER', 'DRIVER']}>
                  <ProtectedLayout>
                    <DeliveryDetails />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/tracking"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <LiveTracking />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/maintenance"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <Maintenance />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/issues"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <Issues />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/reports"
              element={
                <RoleGuard allowedRoles={['ADMIN', 'DISPATCHER', 'VIEWER']}>
                  <ProtectedLayout>
                    <Reports />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/settings"
              element={
                <RoleGuard allowedRoles={['ADMIN']}>
                  <ProtectedLayout>
                    <Settings />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/admin"
              element={
                <RoleGuard allowedRoles={['ADMIN']}>
                  <ProtectedLayout>
                    <Admin />
                  </ProtectedLayout>
                </RoleGuard>
              }
            />
            <Route
              path="/users"
              element={
                <RoleGuard allowedRoles={['ADMIN']}>
                  <ProtectedLayout>
                    <Admin />
                  </ProtectedLayout>
                </RoleGuard>
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
