import React, { useState } from 'react';
import { 
  Menu, 
  Shield, 
  UserCheck, 
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { DEFAULT_USERS } from '../../lib/supabase';
import { generateContractingExcelWorkbook } from '../../lib/excelExportService';

interface HeaderProps {
  currentView: string;
  onOpenMobileMenu: () => void;
  onNavigate: (view: string) => void;
}

const VIEW_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'لوحة التحكم الرئيسية', subtitle: 'نظرة عامة على المشروعات والأبراج وإحصائيات النظام' },
  projects: { title: 'إدارة المشروعات', subtitle: 'سجل مشروعات التطوير العقاري والمقاولات ومتابعة الإنجاز' },
  towers: { title: 'إدارة الأبراج والمباني', subtitle: 'متابعة الأبراج الإنشائية وتوزيع الوحدات والمخطط الزمني' },
  costs: { title: 'التكاليف والمصروفات على الأبراج', subtitle: 'قيد وتوزيع التكاليف والمصروفات على الأبراج والوحدات العقارية (م²)' },
  inventory: { title: 'إدارة المخازن والمواد الخام', subtitle: 'متابعة أرصدة الخامات وتوريد وصرف المواد على الأبراج تحت التنفيذ' },
  installments: { title: 'تحصيل الأقساط وسندات القبض', subtitle: 'تحصيل الأقساط نقداً وتحويلات بنكية وشيكات وإصدار إيصالات القبض' },
  banking: { title: 'الحسابات البنكية والخزائن', subtitle: 'أرصدة البنوك وحركات الإيداع والصرف والتدفقات النقدية التشغيلية' },
  reports: { title: 'تقارير الأقساط والتحصيل', subtitle: 'متابعة دقيقة للأقساط المتأخرة والتحصيلات القادمة وجداول التدفقات النقدية' },
  users: { title: 'إدارة المستخدمين', subtitle: 'حسابات فريق العمل والصلاحيات الوظيفية وحالة الحسابات' },
  roles_permissions: { title: 'الأدوار والصلاحيات', subtitle: 'مصفوفة التحكم في صلاحيات الوصول والإجراءات لكافة الأقسام' },
  activity_logs: { title: 'سجل النشاط والعمليات', subtitle: 'التدقيق الأمني ومتابعة كافة العمليات المنفذة على النظام' },
  settings: { title: 'الإعدادات العامة والربط', subtitle: 'بيانات الشركة، العملة، الشعار، وإعدادات Supabase PostgreSQL' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileMenu,
  onNavigate,
}) => {
  const { user, role, switchDemoUser } = useAuth();
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      await generateContractingExcelWorkbook();
    } catch (err) {
      console.error('Failed to export excel workbook', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const titleInfo = VIEW_TITLES[currentView] || {
    title: currentView.startsWith('project-detail') ? 'تفاصيل المشروع' : 'النظام',
    subtitle: 'نظام إدارة شركة المقاولات والتطوير العقاري',
  };

  return (
    <header 
      id="app-header"
      className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between"
      dir="rtl"
    >
      <div className="flex items-center gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          id="mobile-menu-open-btn"
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl lg:hidden"
          aria-label="فتح القائمة الجانبية"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
            {titleInfo.title}
          </h2>
          <p className="text-xs text-slate-500 hidden sm:block mt-0.5">
            {titleInfo.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Export Excel Workbook Button */}
        <button
          type="button"
          id="export-excel-workbook-btn"
          onClick={handleExportExcel}
          disabled={isExportingExcel}
          className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          title="تحميل ملف إكسيل متكامل (Excel Workbook) يحتوي على كافة الجداول والمعادلات"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">
            {isExportingExcel ? 'جاري تجهيز الإكسيل...' : 'تحميل شيت إكسيل شامل'}
          </span>
          <Download className="w-3.5 h-3.5 text-emerald-700" />
        </button>

        {/* Quick Role Tester dropdown for instant testing of all 8 roles */}
        <div className="relative">
          <button
            type="button"
            id="role-switch-toggle-btn"
            onClick={() => setShowRoleSwitcher(!showRoleSwitcher)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
          >
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">تبديل الدور للتجربة:</span>
            <span className="font-bold text-slate-900">{role?.name || 'مدير'}</span>
          </button>

          {showRoleSwitcher && (
            <div 
              id="role-switcher-dropdown"
              className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 text-right animate-fadeIn"
            >
              <div className="px-3 py-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                اختر مستخدماً لتجربة الصلاحيات:
              </div>
              <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                {DEFAULT_USERS.map((u) => {
                  const isCurrent = user?.id === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        switchDemoUser(u.id);
                        setShowRoleSwitcher(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors text-right ${
                        isCurrent ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{u.full_name}</div>
                        <div className="text-slate-500 text-[11px]">{u.role_name}</div>
                      </div>
                      {isCurrent && <UserCheck className="w-4 h-4 text-blue-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
