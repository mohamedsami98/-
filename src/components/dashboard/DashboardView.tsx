import React, { useEffect, useState } from 'react';
import { 
  Building2, 
  Building, 
  Users, 
  UserCheck, 
  Clock, 
  CheckCircle, 
  Plus, 
  ArrowLeft, 
  Activity, 
  MapPin, 
  Calendar,
  AlertCircle,
  Receipt,
  Package,
  CreditCard,
  Landmark,
  ChevronLeft,
  FileSpreadsheet,
  Download,
  FileBarChart
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { ProjectStatusBadge, ProjectTypeBadge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Project, ActivityLog } from '../../types';
import { generateContractingExcelWorkbook } from '../../lib/excelExportService';

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  onOpenNewProject: () => void;
  onOpenNewTower: () => void;
  onSelectProject: (projectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenNewProject,
  onOpenNewTower,
  onSelectProject,
}) => {
  const { hasPermission } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    inProgressProjects: 0,
    completedProjects: 0,
    totalTowers: 0,
    totalUsers: 0,
    activeUsers: 0,
    recentProjects: [] as Project[],
    recentActivity: [] as ActivityLog[],
  });

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await dataService.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner message="جاري جلب إحصائيات المشروعات والأبراج من قاعدة البيانات..." />;
  }

  const canCreateProject = hasPermission('projects', 'create');
  const canCreateTower = hasPermission('towers', 'create');

  return (
    <div className="space-y-8" dir="rtl">
      {/* Top Banner with Quick Actions */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-3 border border-blue-400/20">
            <span>المرحلة الأولى: التأسيس وإدارة الإنشاءات</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
            لوحة مؤشرات المشروعات والتطوير العقاري
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            متابعة شاملة للمواقع، الأبراج الإنشائية، نسب التنفيذ الميدانية، وسجل النشاط اليومي للفريق.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <button
            type="button"
            id="dashboard-export-excel-btn"
            onClick={async () => {
              try {
                setIsExportingExcel(true);
                await generateContractingExcelWorkbook();
              } catch (err) {
                console.error(err);
              } finally {
                setIsExportingExcel(false);
              }
            }}
            disabled={isExportingExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/30 transition-all hover:-translate-y-0.5 disabled:opacity-50"
            title="تصدير ملف إكسيل كامل لكافة أقسام الشركة والمعادلات"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'جاري تجهيز الإكسيل...' : 'تصدير إكسيل متكامل'}</span>
            <Download className="w-3.5 h-3.5" />
          </button>

          {canCreateProject && (
            <button
              type="button"
              id="dashboard-add-project-btn"
              onClick={onOpenNewProject}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/30 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مشروع جديد</span>
            </button>
          )}

          {canCreateTower && (
            <button
              type="button"
              id="dashboard-add-tower-btn"
              onClick={onOpenNewTower}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold border border-slate-700 transition-all hover:-translate-y-0.5"
            >
              <Building className="w-4 h-4 text-amber-400" />
              <span>إضافة برج إنشائي</span>
            </button>
          )}
        </div>
      </div>

      {/* 6 Core Stat Cards (Required: total projects, in_progress, completed, total towers, total users, active users) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          id="stat-total-projects"
          title="عدد المشروعات"
          value={stats.totalProjects}
          subtitle="إجمالي المشروعات المسجلة"
          icon={Building2}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />

        <StatCard
          id="stat-inprogress-projects"
          title="المشروعات تحت التنفيذ"
          value={stats.inProgressProjects}
          subtitle="مواقع العمل النشطة"
          icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />

        <StatCard
          id="stat-completed-projects"
          title="المشروعات المنتهية"
          value={stats.completedProjects}
          subtitle="تم تسليمها بالكامل"
          icon={CheckCircle}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
        />

        <StatCard
          id="stat-total-towers"
          title="عدد الأبراج"
          value={stats.totalTowers}
          subtitle="أبراج ومبانٍ موزعة"
          icon={Building}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />

        <StatCard
          id="stat-total-users"
          title="إجمالي المستخدمين"
          value={stats.totalUsers}
          subtitle="فريق العمل المسجل"
          icon={Users}
          iconColor="text-slate-600"
          bgColor="bg-slate-100"
        />

        <StatCard
          id="stat-active-users"
          title="المستخدمون النشطون"
          value={stats.activeUsers}
          subtitle="حسابات مفعلة بالنظام"
          icon={UserCheck}
          iconColor="text-teal-600"
          bgColor="bg-teal-50"
        />
      </div>

      {/* Quick Financial & Operational Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('costs')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all text-right group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-1 transition-all" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">التكاليف والمصروفات</h4>
          <p className="mt-1 text-xs text-slate-500">قيد تكاليف الأبراج وتوزيعها على الوحدات (م²)</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('inventory')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all text-right group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Package className="w-5 h-5" />
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:-translate-x-1 transition-all" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">المخازن والمواد الخام</h4>
          <p className="mt-1 text-xs text-slate-500">أذون التوريد وصرف الخامات للأبراج المنفذة</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('installments')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all text-right group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CreditCard className="w-5 h-5" />
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:-translate-x-1 transition-all" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">تحصيل الأقساط العقارية</h4>
          <p className="mt-1 text-xs text-slate-500">تحصيل نقدي وبنكي وشيكات وسندات قبض</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('reports')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-indigo-400 hover:shadow-md transition-all text-right group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileBarChart className="w-5 h-5" />
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-1 transition-all" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">تقارير الأقساط والتحصيل</h4>
          <p className="mt-1 text-xs text-slate-500">متابعة المتأخرات والتحصيلات القادمة</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('banking')}
          className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-purple-400 hover:shadow-md transition-all text-right group"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Landmark className="w-5 h-5" />
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:-translate-x-1 transition-all" />
          </div>
          <h4 className="mt-3 text-sm font-bold text-slate-900">الحسابات البنكية والخزائن</h4>
          <p className="mt-1 text-xs text-slate-500">أرصدة البنوك والسيولة وسجل التدفق النقدي</p>
        </button>
      </div>

      {/* Two Column Layout: Recent Projects & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Projects Section (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  المشروعات الأخيرة
                </h3>
              </div>
              <button
                type="button"
                id="view-all-projects-btn"
                onClick={() => onNavigate('projects')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>عرض كافة المشروعات</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.recentProjects.length === 0 ? (
              <EmptyState
                id="empty-recent-projects"
                title="لا توجد مشروعات مسجلة حتى الآن"
                description="ابدأ بإضافة أول مشروع لشركة التطوير العقاري للمتابعة."
                actionText={canCreateProject ? 'إضافة مشروع جديد' : undefined}
                onAction={onOpenNewProject}
              />
            ) : (
              <div className="space-y-3">
                {stats.recentProjects.map((project) => (
                  <div
                    key={project.id}
                    id={`recent-project-${project.id}`}
                    onClick={() => onSelectProject(project.id)}
                    className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/20 transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {project.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h4>
                          <ProjectTypeBadge type={project.project_type} />
                        </div>

                        <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{project.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span>{project.towers_count || 0} أبراج</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left flex flex-col items-end">
                        <ProjectStatusBadge status={project.status} />
                        <span className="text-xs font-bold text-slate-700 mt-2">
                          {project.completion_rate}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${project.completion_rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Activity Logs Section (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  آخر الأنشطة والعمليات
                </h3>
              </div>
              <button
                type="button"
                id="view-all-activities-btn"
                onClick={() => onNavigate('activity_logs')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <span>السجل الكامل</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

            {stats.recentActivity.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                لا توجد سجلات نشاط حتى الآن.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentActivity.map((log) => {
                  const date = new Date(log.created_at);
                  const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
                  const dateStr = date.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });

                  return (
                    <div
                      key={log.id}
                      id={`recent-log-${log.id}`}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5">
                        {log.user_name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-800 leading-relaxed">
                          {log.description}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{dateStr} - {timeStr}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="font-semibold text-slate-600">{log.user_name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
