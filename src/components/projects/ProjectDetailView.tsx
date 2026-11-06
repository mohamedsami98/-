import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Building, 
  ArrowRight, 
  Calendar, 
  Coins, 
  MapPin, 
  User, 
  Clock, 
  Plus, 
  FileText, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Edit3,
  Trash2
} from 'lucide-react';
import { Project, Tower, ActivityLog } from '../../types';
import { ProjectStatusBadge, ProjectTypeBadge, TowerStatusBadge, TowerTypeBadge } from '../common/Badge';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ProjectDetailViewProps {
  projectId: string;
  onBack: () => void;
  onOpenNewTowerForProject: (projectId: string) => void;
  onEditTower: (tower: Tower) => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  projectId,
  onBack,
  onOpenNewTowerForProject,
  onEditTower,
}) => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'towers' | 'details' | 'activity'>('overview');

  // Deletion for a tower
  const [towerToDelete, setTowerToDelete] = useState<Tower | null>(null);
  const [isDeletingTower, setIsDeletingTower] = useState(false);

  const canCreateTower = hasPermission('towers', 'create');
  const canEditTower = hasPermission('towers', 'edit');
  const canDeleteTower = hasPermission('towers', 'delete');

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await dataService.getProjectById(projectId);
      if (p) {
        setProject(p);
        const t = await dataService.getTowers(projectId);
        setTowers(t);
        const allLogs = await dataService.getActivityLogs(100);
        // filter logs relating to this project or its code
        const relevantLogs = allLogs.filter(
          (l) => l.record_id === p.id || l.record_id === p.code || l.description.includes(p.name) || l.description.includes(p.code)
        );
        setActivityLogs(relevantLogs);
      }
    } catch (err) {
      console.error('Failed to load project details', err);
      error('حدث خطأ أثناء تحميل تفاصيل المشروع.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [projectId]);

  const handleDeleteTowerConfirm = async () => {
    if (!towerToDelete || !user) return;
    setIsDeletingTower(true);
    try {
      await dataService.deleteTower(towerToDelete.id, user);
      success(`تم حذف برج "${towerToDelete.name}" بنجاح.`);
      setTowerToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل حذف البرج.');
    } finally {
      setIsDeletingTower(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="جاري جلب تفاصيل المشروع والأبراج..." />;
  }

  if (!project) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center max-w-md mx-auto my-12" dir="rtl">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">المشروع غير موجود</h3>
        <p className="text-xs text-slate-500 mt-1">قد يكون تم حذفه أو لم يعد متاحاً.</p>
        <button
          type="button"
          onClick={onBack}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
        >
          العودة للمشروعات
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          id="project-detail-back-btn"
          onClick={onBack}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-1.5 text-xs font-bold"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة لقائمة المشروعات</span>
        </button>
      </div>

      {/* Top Header Card: Project Name, Code, Status, Completion Rate */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 border border-slate-200">
                {project.code}
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {project.name}
              </h1>
              <ProjectTypeBadge type={project.project_type} />
            </div>

            <div className="mt-2.5 flex items-center gap-4 text-xs text-slate-500 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {project.location}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                المالك: {project.owner_name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                المشرف: {project.project_manager_name || 'غير محدد'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-left flex flex-col items-end">
              <ProjectStatusBadge status={project.status} />
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-900">{project.completion_rate}%</span>
                <span className="text-xs text-slate-400 font-semibold">نسبة الإنجاز</span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Required Metric Cards: عدد الأبراج، الميزانية التقديرية، تاريخ البداية، تاريخ الانتهاء المتوقع */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>عدد الأبراج الإنشائية</span>
              <Building className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {towers.length.toLocaleString('ar-EG')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">مبنى ومجمع داخل الموقع</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>الميزانية التقديرية</span>
              <Coins className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xl font-black text-slate-900 truncate">
              {project.estimated_budget.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">بالجنيه المصري (EGP)</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>تاريخ البداية</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono" dir="ltr">
              {project.start_date}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">بدء الأعمال الميدانية</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-2">
              <span>تاريخ الانتهاء المتوقع</span>
              <Calendar className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-lg font-bold text-slate-900 font-mono" dir="ltr">
              {project.expected_end_date}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">الموعد التعاقدي للتسليم</div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation: نظرة عامة | الأبراج | تفاصيل المشروع | النشاط */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-slate-100 px-6 pt-3 overflow-x-auto gap-2">
          <button
            type="button"
            id="tab-overview-btn"
            onClick={() => setActiveTab('overview')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>نظرة عامة</span>
          </button>

          <button
            type="button"
            id="tab-towers-btn"
            onClick={() => setActiveTab('towers')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'towers'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>الأبراج ({towers.length})</span>
          </button>

          <button
            type="button"
            id="tab-details-btn"
            onClick={() => setActiveTab('details')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>تفاصيل المشروع</span>
          </button>

          <button
            type="button"
            id="tab-activity-btn"
            onClick={() => setActiveTab('activity')}
            className={`px-5 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'activity'
                ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-xl'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>النشاط ({activityLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Overview (نظرة عامة) */}
        {activeTab === 'overview' && (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Description */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  وصف المشروع والمواصفات
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {project.description || 'لم يتم إدخال وصف تفصيلي لهذا المشروع بعد.'}
                </p>
              </div>

              {/* Notes */}
              <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ملاحظات هندسية وميدانية
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                  {project.notes || 'لا توجد ملاحظات خاصة مسجلة.'}
                </p>
              </div>
            </div>

            {/* Quick Towers overview */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-900">
                  الأبراج المسجلة بالمشروع
                </h3>
                {canCreateTower && (
                  <button
                    type="button"
                    onClick={() => onOpenNewTowerForProject(project.id)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة برج</span>
                  </button>
                )}
              </div>

              {towers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <Building className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">لا توجد أبراج مرتبطة بهذا المشروع حتى الآن.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {towers.map((tower) => (
                    <div
                      key={tower.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {tower.code}
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 mt-1.5">{tower.name}</h4>
                        </div>
                        <TowerStatusBadge status={tower.status} />
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                        <span>الأدوار: {tower.floors_count}</span>
                        <span>الوحدات: {tower.planned_units_count}</span>
                      </div>
                      <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full"
                          style={{ width: `${tower.completion_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Towers (الأبراج) */}
        {activeTab === 'towers' && (
          <div className="p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  قائمة أبراج مشروع {project.name}
                </h3>
                <p className="text-xs text-slate-500">إجمالي الأبراج التابعة: {towers.length}</p>
              </div>

              {canCreateTower && (
                <button
                  type="button"
                  id="add-tower-to-project-btn"
                  onClick={() => onOpenNewTowerForProject(project.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة برج جديد لهذا المشروع</span>
                </button>
              )}
            </div>

            {towers.length === 0 ? (
              <EmptyState
                id="empty-project-towers"
                title="لا توجد أبراج مسجلة لهذا المشروع بعد"
                description="قم بربط الأبراج والمباني الإنشائية بهذا المشروع لمتابعة نسب الإنجاز."
                actionText={canCreateTower ? 'إضافة أول برج' : undefined}
                onAction={() => onOpenNewTowerForProject(project.id)}
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-600 text-xs font-bold">
                      <th className="py-3.5 px-4">كود البرج</th>
                      <th className="py-3.5 px-4">اسم البرج</th>
                      <th className="py-3.5 px-4">النوع</th>
                      <th className="py-3.5 px-4">عدد الأدوار</th>
                      <th className="py-3.5 px-4">الوحدات المخططة</th>
                      <th className="py-3.5 px-4">تاريخ البدء</th>
                      <th className="py-3.5 px-4">تاريخ الانتهاء</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4">نسبة الإنجاز</th>
                      <th className="py-3.5 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {towers.map((tower) => (
                      <tr key={tower.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                          {tower.code}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {tower.name}
                        </td>
                        <td className="py-3.5 px-4">
                          <TowerTypeBadge type={tower.tower_type} />
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {tower.floors_count}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-700">
                          {tower.planned_units_count}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs" dir="ltr">
                          {tower.start_date}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-xs" dir="ltr">
                          {tower.expected_end_date}
                        </td>
                        <td className="py-3.5 px-4">
                          <TowerStatusBadge status={tower.status} />
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-xs text-slate-800">{tower.completion_rate}%</span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {canEditTower && (
                              <button
                                type="button"
                                onClick={() => onEditTower(tower)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg"
                                title="تعديل البرج"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDeleteTower && (
                              <button
                                type="button"
                                onClick={() => setTowerToDelete(tower)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                                title="حذف البرج"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Details (تفاصيل المشروع) */}
        {activeTab === 'details' && (
          <div className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">كود المشروع الداخلي</span>
                <p className="text-sm font-mono font-bold text-slate-900">{project.code}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">اسم المالك الرسمي</span>
                <p className="text-sm font-bold text-slate-900">{project.owner_name}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">النوع الإنشائي</span>
                <p className="text-sm font-bold text-slate-900">
                  <ProjectTypeBadge type={project.project_type} />
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">الموقع العام</span>
                <p className="text-sm font-bold text-slate-900">{project.location}</p>
              </div>

              <div className="space-y-1 md:col-span-2">
                <span className="text-xs font-semibold text-slate-400">العنوان التفصيلي</span>
                <p className="text-sm text-slate-800">{project.detailed_address || 'لم يحدد'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">تاريخ بدء التنفيذ</span>
                <p className="text-sm font-mono text-slate-900" dir="ltr">{project.start_date}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">تاريخ الانتهاء المخطط</span>
                <p className="text-sm font-mono text-slate-900" dir="ltr">{project.expected_end_date}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">تاريخ الانتهاء الفعلي</span>
                <p className="text-sm font-mono text-slate-900" dir="ltr">{project.actual_end_date || 'قيد التنفيذ'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">الميزانية التقديرية</span>
                <p className="text-sm font-bold text-slate-900">{project.estimated_budget.toLocaleString('ar-EG')} جنيه مصري</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">تاريخ إنشاء السجل بالنظام</span>
                <p className="text-xs font-mono text-slate-500" dir="ltr">{new Date(project.created_at).toLocaleString('ar-EG')}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400">آخر تحديث للبيانات</span>
                <p className="text-xs font-mono text-slate-500" dir="ltr">{new Date(project.updated_at).toLocaleString('ar-EG')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Activity (النشاط) */}
        {activeTab === 'activity' && (
          <div className="p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-bold text-slate-900 mb-3">
              سجل نشاطات هذا المشروع
            </h3>
            {activityLogs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl">
                لا توجد سجلات نشاط مرتبطة بهذا المشروع حتى الآن.
              </div>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                      {log.user_name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                        {log.description}
                      </p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{new Date(log.created_at).toLocaleString('ar-EG')}</span>
                        <span>•</span>
                        <span className="font-medium text-slate-600">{log.user_name}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tower deletion confirmation dialog */}
      <ConfirmDialog
        isOpen={Boolean(towerToDelete)}
        title="تأكيد حذف البرج"
        message={`هل أنت متأكد من حذف برج "${towerToDelete?.name}" (كود: ${towerToDelete?.code})؟`}
        confirmText="نعم، حذف البرج"
        cancelText="إلغاء"
        isDestructive={true}
        loading={isDeletingTower}
        onConfirm={handleDeleteTowerConfirm}
        onCancel={() => setTowerToDelete(null)}
      />
    </div>
  );
};
