import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/auth/LoginPage';
import RegisterPage from './components/auth/RegisterPage';
import Sidebar, { Page } from './components/common/Sidebar';
import MemberDashboard from './components/member/MemberDashboard';
import RenewalWizard from './components/member/RenewalWizard';
import ApplicationTracking from './components/member/ApplicationTracking';
import MemberProfile from './components/member/MemberProfile';
import OfficerDashboard from './components/officer/OfficerDashboard';
import AdminDashboard from './components/admin/AdminDashboard';

type AuthView = 'login' | 'register';

function AppContent() {
  const { profile, loading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  // Auto-navigate to role default page when profile loads after sign-in
  React.useEffect(() => {
    if (!profile) return;
    if (profile.role === 'admin') setCurrentPage('admin-dashboard');
    else if (profile.role === 'officer') setCurrentPage('officer-dashboard');
    else setCurrentPage('dashboard');
  }, [profile?.id, profile?.role]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cpecb-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img
            src="/CPECB-Logo.png"
            alt="CPECB"
            className="h-16 w-16 object-contain animate-pulse"
          />
          <div className="flex items-center gap-2 text-navy-900">
            <div className="w-5 h-5 border-2 border-royal-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Loading CPECB Portal...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    if (authView === 'register') {
      return <RegisterPage onGoLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onGoRegister={() => setAuthView('register')} />;
  }

  const handleNavigate = (page: Page) => setCurrentPage(page);

  const renderContent = () => {
    const role = profile.role;

    // Member pages
    if (role === 'member') {
      switch (currentPage) {
        case 'dashboard': return <MemberDashboard onNavigate={handleNavigate} />;
        case 'renew': return <RenewalWizard onNavigate={handleNavigate} />;
        case 'history': return <ApplicationTracking />;
        case 'profile': return <MemberProfile />;
        default: return <MemberDashboard onNavigate={handleNavigate} />;
      }
    }

    // Officer pages
    if (role === 'officer') {
      switch (currentPage) {
        case 'officer-dashboard':
        case 'officer-applications':
          return <OfficerDashboard />;
        case 'officer-reports':
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-lg font-medium">Reports Module</p>
                <p className="text-gray-300 text-sm mt-1">Coming soon</p>
              </div>
            </div>
          );
        default: return <OfficerDashboard />;
      }
    }

    // Admin pages
    if (role === 'admin') {
      switch (currentPage) {
        case 'admin-dashboard': return <AdminDashboard initialView="dashboard" />;
        case 'admin-renewals': return <AdminDashboard initialView="renewals" />;
        case 'admin-members': return <AdminDashboard initialView="members" />;
        case 'admin-reports': return <AdminDashboard initialView="dashboard" />;
        case 'admin-settings':
          return (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-400 text-lg font-medium">System Settings</p>
                <p className="text-gray-300 text-sm mt-1">Coming soon</p>
              </div>
            </div>
          );
        default: return <AdminDashboard initialView="dashboard" />;
      }
    }

    return null;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-cpecb-bg">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
