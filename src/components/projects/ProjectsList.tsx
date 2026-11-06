import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  Filter, 
  Building, 
  MapPin, 
  Calendar, 
  Coins, 
  User,
  SlidersHorizontal,
  Download,
  Printer
} from 'lucide-react';
import { Project, ProjectStatus, ProjectType } from '../../types';
import { ProjectStatusBadge, ProjectTypeBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface ProjectsListProps {
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectModal: () => void;
  onOpenEditProjectModal: (project: Project) => void;
}

export const ProjectsList: React.FC<ProjectsListProps> = ({
  onSelectProject,
  onOpenNewProjectModal,
  onOpenEditProjectModal,
}) => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Deletion state
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission('projects', 'create');
  const canEdit = hasPermission('projects', 'edit');
  const canDelete = hasPermission('projects', 'delete');
  const canPrint = hasPermission('projects', 'print');
  const canExport = hasPermission('projects', 'export');

  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await dataService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
      error('حدث خطأ أثناء تحميل المشروعات من الخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!projectToDelete || !user) return;
    setIsDeleting(true);
    try {
      await dataService.deleteProject(projectToDelete.id, user);
      success(`تم حذف مشروع "${projectToDelete.name}" بنجاح.`);
      setProjectToDelete(null);
      await loadProjects();
    } catch (err: any) {
      error(err.message || 'فشل حذف المشروع، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter and search
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = 
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query) ||
        p.owner_name.toLowerCase().includes(query);

      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      const matchesType = typeFilter === 'all' || p.project_type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [projects, searchQuery, statusFilter, typeFilter]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    if (filteredProjects.length === 0) {
      error('لا توجد بيانات لتصديرها.');
      return;
    }
    const headers = ['كود المشروع', 'اسم المشروع', 'المالك', 'الموقع', 'النوع', 'الحالة', 'مدير المشروع', 'الميزانية التقديرية (EGP)', 'نسبة الإنجاز %'];
    const rows = filteredProjects.map((p) => [
      p.code,
      `"${p.name}"`,
      `"${p.owner_name}"`,
      `"${p.location}"`,
      p.project_type,
      p.status,
      `"${p.project_manager_name}"`,
      p.estimated_budget,
      p.completion_rate
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `مشروعات_الشركة_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير ملف المشروعات بنجاح.');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header with Title & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            سجل المشروعات الإنشائية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة كافة مواقع العمل ومتابعة الميزانيات ونسب الإنجاز والأبراج التابعة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              type="button"
              id="export-projects-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
              title="تصدير كملف CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>
          )}

          {canPrint && (
            <button
              type="button"
              id="print-projects-btn"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
              title="طباعة الجدول"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">طباعة</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              id="add-new-project-btn"
              onClick={onOpenNewProjectModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مشروع جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search input (Name or Code) */}
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="projects-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم المشروع، الكود، الموقع، المالك..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48 flex-shrink-0">
          <select
            id="projects-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">جميع الحالات</option>
            <option value="planned">مخطط</option>
            <option value="in_progress">تحت التنفيذ</option>
            <option value="paused">متوقف</option>
            <option value="completed">منتهي ومسلّم</option>
          </select>
        </div>

        {/* Type Filter */}
        <div className="w-full md:w-48 flex-shrink-0">
          <select
            id="projects-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">جميع أنواع المشروعات</option>
            <option value="residential">سكني</option>
            <option value="commercial">تجاري</option>
            <option value="administrative">إداري</option>
            <option value="mixed">مختلط</option>
            <option value="other">أخرى</option>
          </select>
        </div>
      </div>

      {/* Projects Table / Content */}
      {loading ? (
        <LoadingSpinner message="جاري جلب المشروعات..." />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          id="empty-projects-list"
          title={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'لا توجد مشروعات مطابقة لمعايير البحث' : 'لا توجد مشروعات مسجلة حتى الآن'}
          description={searchQuery || statusFilter !== 'all' || typeFilter !== 'all' ? 'جرب تغيير كلمات البحث أو إعادة ضبط الفلاتر.' : 'ابدأ بإضافة أول مشروع لشركة التطوير العقاري للمتابعة.'}
          actionText={canCreate ? 'إضافة مشروع جديد' : undefined}
          onAction={onOpenNewProjectModal}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse" id="projects-table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">كود المشروع</th>
                  <th className="py-4 px-4 sm:px-6">اسم المشروع</th>
                  <th className="py-4 px-4">الموقع</th>
                  <th className="py-4 px-4">نوع المشروع</th>
                  <th className="py-4 px-4">مدير المشروع</th>
                  <th className="py-4 px-4">تاريخ البداية</th>
                  <th className="py-4 px-4">تاريخ الانتهاء</th>
                  <th className="py-4 px-4">الميزانية التقديرية</th>
                  <th className="py-4 px-4">حالة المشروع</th>
                  <th className="py-4 px-4">نسبة الإنجاز</th>
                  <th className="py-4 px-4 sm:px-6 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredProjects.map((p) => {
                  return (
                    <tr 
                      key={p.id}
                      id={`project-row-${p.id}`}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Code */}
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-800 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
                          {p.code}
                        </span>
                      </td>

                      {/* Name & Towers count */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <button
                          type="button"
                          id={`project-name-btn-${p.id}`}
                          onClick={() => onSelectProject(p.id)}
                          className="font-bold text-slate-900 hover:text-blue-600 transition-colors text-right flex flex-col"
                        >
                          <span>{p.name}</span>
                          <span className="text-[11px] font-normal text-slate-400 mt-0.5">
                            المالك: {p.owner_name} • {p.towers_count || 0} أبراج
                          </span>
                        </button>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span className="truncate max-w-[150px]" title={p.location}>{p.location}</span>
                        </div>
                      </td>

                      {/* Project Type */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <ProjectTypeBadge type={p.project_type} />
                      </td>

                      {/* Manager */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-700 font-medium">
                        {p.project_manager_name || '—'}
                      </td>

                      {/* Start Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                        {p.start_date}
                      </td>

                      {/* Expected End Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                        {p.expected_end_date}
                      </td>

                      {/* Budget */}
                      <td className="py-4 px-4 whitespace-nowrap font-bold text-slate-900">
                        <span>{p.estimated_budget.toLocaleString('ar-EG')}</span>
                        <span className="text-[11px] font-normal text-slate-500 mr-1">ج.م</span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <ProjectStatusBadge status={p.status} />
                      </td>

                      {/* Completion rate */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="w-24">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                            <span>{p.completion_rate}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-full rounded-full transition-all duration-300"
                              style={{ width: `${p.completion_rate}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View button */}
                          <button
                            type="button"
                            id={`view-project-btn-${p.id}`}
                            onClick={() => onSelectProject(p.id)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض تفاصيل المشروع"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          {canEdit && (
                            <button
                              type="button"
                              id={`edit-project-btn-${p.id}`}
                              onClick={() => onOpenEditProjectModal(p)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="تعديل بيانات المشروع"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete button */}
                          {canDelete && (
                            <button
                              type="button"
                              id={`delete-project-btn-${p.id}`}
                              onClick={() => setProjectToDelete(p)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="حذف المشروع"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>إجمالي المشروعات المعروضة: <strong>{filteredProjects.length}</strong> من أصل {projects.length}</span>
            <span>العملة الافتراضية: الجنيه المصري (EGP)</span>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deletion */}
      <ConfirmDialog
        isOpen={Boolean(projectToDelete)}
        title="تأكيد حذف المشروع"
        message={`هل أنت متأكد من حذف مشروع "${projectToDelete?.name}" (كود: ${projectToDelete?.code})؟ سيؤدي ذلك أيضاً إلى حذف كافة الأبراج المرتبطة به نهائياً.`}
        confirmText="نعم، حذف المشروع"
        cancelText="إلغاء"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
};
