import React, { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';
import { SystemModule } from '../../types';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface LayoutProps {
  currentView: string;
  onNavigate: (view: string) => void;
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentView,
  onNavigate,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { canAccessModule } = useAuth();

  // Determine current module for permission checking
  let targetModule: SystemModule = 'dashboard';
  if (currentView.startsWith('projects') || currentView.startsWith('project-detail')) {
    targetModule = 'projects';
  } else if (currentView.startsWith('towers')) {
    targetModule = 'towers';
  } else if (currentView.startsWith('costs')) {
    targetModule = 'costs';
  } else if (currentView.startsWith('inventory')) {
    targetModule = 'inventory';
  } else if (currentView.startsWith('installments')) {
    targetModule = 'installments';
  } else if (currentView.startsWith('banking')) {
    targetModule = 'banking';
  } else if (currentView.startsWith('users')) {
    targetModule = 'users';
  } else if (currentView.startsWith('roles')) {
    targetModule = 'roles_permissions';
  } else if (currentView.startsWith('activity')) {
    targetModule = 'activity_logs';
  } else if (currentView.startsWith('settings')) {
    targetModule = 'settings';
  }

  const hasAccess = canAccessModule(targetModule);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" dir="rtl">
      {/* Sidebar - fixed on right */}
      <Sidebar
        currentView={currentView}
        onNavigate={onNavigate}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area - with margin-right on desktop for the fixed sidebar */}
      <div className="flex-1 flex flex-col lg:mr-72 transition-all">
        <Header
          currentView={currentView}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onNavigate={onNavigate}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {hasAccess ? (
            children
          ) : (
            <div 
              id="unauthorized-access-container"
              className="bg-white rounded-3xl border border-rose-100 p-12 text-center max-w-lg mx-auto my-12 shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                ليس لديك صلاحية للوصول إلى هذه الصفحة
              </h2>
              <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                حسابك الحالي لا يمتلك إذن المشاهدة لقسم {targetModule}. يرجى التواصل مع مدير النظام لتعديل صلاحيات دورك.
              </p>
              <button
                type="button"
                id="back-to-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-sm"
              >
                <span>العودة إلى لوحة التحكم</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
