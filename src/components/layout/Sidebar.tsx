import React from 'react';
import { 
  LayoutDashboard, 
  Building2, 
  Building, 
  Users, 
  ShieldCheck, 
  History, 
  Settings, 
  LogOut, 
  HardHat,
  ChevronLeft,
  Receipt,
  Package,
  CreditCard,
  Landmark,
  FileBarChart,
  Truck,
  PieChart
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { SystemModule } from '../../types';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  module: SystemModule;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { user, role, signOut, canAccessModule } = useAuth();
  const { settings } = useSettings();

  const mainNavItems: NavItem[] = [
    { id: 'dashboard', module: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'projects', module: 'projects', label: 'المشروعات', icon: Building2 },
    { id: 'towers', module: 'towers', label: 'الأبراج', icon: Building },
  ];

  const financialNavItems: NavItem[] = [
    { id: 'costs', module: 'costs', label: 'التكاليف والمصروفات', icon: Receipt },
    { id: 'inventory', module: 'inventory', label: 'المخازن والمواد الخام', icon: Package },
    { id: 'suppliers', module: 'suppliers', label: 'الموردون ومقاولو الباطن', icon: Truck },
    { id: 'partners', module: 'partners', label: 'الشركاء والأرباح', icon: PieChart },
    { id: 'installments', module: 'installments', label: 'تحصيل الأقساط', icon: CreditCard },
    { id: 'reports', module: 'reports', label: 'تقارير الأقساط والتحصيل', icon: FileBarChart },
    { id: 'banking', module: 'banking', label: 'الحسابات البنكية والخزائن', icon: Landmark },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'users', module: 'users', label: 'المستخدمون', icon: Users },
    { id: 'roles_permissions', module: 'roles_permissions', label: 'الأدوار والصلاحيات', icon: ShieldCheck },
    { id: 'activity_logs', module: 'activity_logs', label: 'سجل النشاط', icon: History },
    { id: 'settings', module: 'settings', label: 'الإعدادات العامة', icon: Settings },
  ];

  // Filter items according to permissions
  const allowedMainItems = mainNavItems.filter((item) => canAccessModule(item.module));
  const allowedFinancialItems = financialNavItems.filter((item) => canAccessModule(item.module));
  const allowedAdminItems = adminNavItems.filter((item) => canAccessModule(item.module));

  const handleItemClick = (id: string) => {
    onNavigate(id);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          id="sidebar-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 right-0 z-40 w-72 bg-slate-900 text-white flex flex-col border-l border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        }`}
        dir="rtl"
      >
        {/* Brand & Logo Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20 flex-shrink-0">
            {settings.logo_url ? (
              <img 
                src={settings.logo_url} 
                alt="Logo" 
                className="w-8 h-8 object-contain rounded"
              />
            ) : (
              <HardHat className="w-6 h-6" />
            )}
          </div>
          <div className="overflow-hidden flex-1">
            <h1 className="text-sm font-bold text-white truncate leading-snug">
              {settings.company_name || 'شركة المقاولات والتطوير'}
            </h1>
            <p className="text-xs text-amber-400 font-medium truncate mt-0.5">
              {settings.system_name || 'نظام إدارة المشروعات'}
            </p>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Main Navigation Group */}
          {allowedMainItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-400 tracking-wider">
                المشروعات والمواقع
              </div>
              <nav className="space-y-1">
                {allowedMainItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id || (item.id === 'projects' && currentView.startsWith('project-detail'));
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`nav-item-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronLeft className="w-4 h-4 opacity-70" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Financial, Inventory & Installments Group */}
          {allowedFinancialItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-400 tracking-wider">
                المالية والمخازن والأقساط
              </div>
              <nav className="space-y-1">
                {allowedFinancialItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`nav-item-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronLeft className="w-4 h-4 opacity-70" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Administration Group */}
          {allowedAdminItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-slate-400 tracking-wider">
                إدارة النظام
              </div>
              <nav className="space-y-1">
                {allowedAdminItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      id={`nav-item-${item.id}`}
                      onClick={() => handleItemClick(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronLeft className="w-4 h-4 opacity-70" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* User Footer & Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-300 flex items-center justify-center font-bold text-sm">
              {user?.full_name ? user.full_name.charAt(0) : 'م'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="text-sm font-semibold text-white truncate">
                {user?.full_name || 'مستخدم النظام'}
              </div>
              <div className="text-xs text-amber-400 font-medium truncate">
                {role?.name || user?.role_name || 'مدير'}
              </div>
            </div>
          </div>

          <button
            type="button"
            id="sidebar-logout-btn"
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
    </>
  );
};
