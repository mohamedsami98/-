import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Building2, 
  Layers, 
  Home, 
  Calendar,
  Download,
  Printer
} from 'lucide-react';
import { Tower, Project, TowerStatus } from '../../types';
import { TowerStatusBadge, TowerTypeBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface TowersListProps {
  onOpenNewTowerModal: () => void;
  onOpenEditTowerModal: (tower: Tower) => void;
  onSelectProject: (projectId: string) => void;
}

export const TowersList: React.FC<TowersListProps> = ({
  onOpenNewTowerModal,
  onOpenEditTowerModal,
  onSelectProject,
}) => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [towers, setTowers] = useState<Tower[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Deletion state
  const [towerToDelete, setTowerToDelete] = useState<Tower | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission('towers', 'create');
  const canEdit = hasPermission('towers', 'edit');
  const canDelete = hasPermission('towers', 'delete');
  const canExport = hasPermission('towers', 'export');
  const canPrint = hasPermission('towers', 'print');

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, pList] = await Promise.all([
        dataService.getTowers(),
        dataService.getProjects(),
      ]);
      setTowers(tList);
      setProjects(pList);
    } catch (err) {
      console.error('Failed to load towers', err);
      error('حدث خطأ أثناء تحميل بيانات الأبراج.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!towerToDelete || !user) return;
    setIsDeleting(true);
    try {
      await dataService.deleteTower(towerToDelete.id, user);
      success(`تم حذف برج "${towerToDelete.name}" بنجاح.`);
      setTowerToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل حذف البرج.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredTowers = useMemo(() => {
    return towers.filter((t) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        t.name.toLowerCase().includes(query) ||
        t.code.toLowerCase().includes(query) ||
        (t.project_name && t.project_name.toLowerCase().includes(query));

      const matchesProject = projectFilter === 'all' || t.project_id === projectFilter;
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [towers, searchQuery, projectFilter, statusFilter]);

  const handleExportCSV = () => {
    if (filteredTowers.length === 0) {
      error('لا توجد بيانات لتصديرها.');
      return;
    }
    const headers = ['كود البرج', 'اسم البرج', 'المشروع', 'النوع', 'الأدوار', 'الوحدات المخططة', 'الحالة', 'نسبة الإنجاز %'];
    const rows = filteredTowers.map((t) => [
      t.code,
      `"${t.name}"`,
      `"${t.project_name || ''}"`,
      t.tower_type,
      t.floors_count,
      t.planned_units_count,
      t.status,
      t.completion_rate
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `أبراج_الشركة_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير ملف الأبراج بنجاح.');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            إدارة الأبراج والمباني الإنشائية
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            متابعة الأبراج الموزعة على المشروعات، توزيع الأدوار، وحجم الوحدات المنفذة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              type="button"
              id="export-towers-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>
          )}

          {canPrint && (
            <button
              type="button"
              id="print-towers-btn"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">طباعة</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              id="add-new-tower-btn"
              onClick={onOpenNewTowerModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة برج جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="towers-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم البرج أو الكود..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* Project Filter */}
        <div className="w-full md:w-56 flex-shrink-0">
          <select
            id="towers-project-filter"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">كافة المشروعات</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44 flex-shrink-0">
          <select
            id="towers-status-filter"
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
      </div>

      {/* Towers Table */}
      {loading ? (
        <LoadingSpinner message="جاري جلب الأبراج الإنشائية..." />
      ) : filteredTowers.length === 0 ? (
        <EmptyState
          id="empty-towers-list"
          title={searchQuery || projectFilter !== 'all' || statusFilter !== 'all' ? 'لا توجد نتائج مطابقة لبحثك' : 'لا توجد أبراج مسجلة حتى الآن'}
          description={searchQuery || projectFilter !== 'all' || statusFilter !== 'all' ? 'جرب البحث باسم آخر أو إزالة الفلاتر.' : 'ابدأ بإضافة أول برج للمشروعات الحالية.'}
          actionText={canCreate ? 'إضافة برج جديد' : undefined}
          onAction={onOpenNewTowerModal}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse" id="towers-table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">كود البرج</th>
                  <th className="py-4 px-4 sm:px-6">اسم البرج</th>
                  <th className="py-4 px-4">المشروع التابع</th>
                  <th className="py-4 px-4">النوع</th>
                  <th className="py-4 px-4">عدد الأدوار</th>
                  <th className="py-4 px-4">الوحدات المخططة</th>
                  <th className="py-4 px-4">تاريخ البدء</th>
                  <th className="py-4 px-4">تاريخ الانتهاء</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">نسبة الإنجاز</th>
                  <th className="py-4 px-4 sm:px-6 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredTowers.map((tower) => (
                  <tr 
                    key={tower.id}
                    id={`tower-row-${tower.id}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-4 px-4 sm:px-6 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700">
                        {tower.code}
                      </span>
                    </td>

                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="font-bold text-slate-900">{tower.name}</div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectProject(tower.project_id)}
                        className="text-blue-600 hover:text-blue-800 font-semibold hover:underline flex items-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{tower.project_name || 'مشروع غير محدد'}</span>
                      </button>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <TowerTypeBadge type={tower.tower_type} />
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tower.floors_count} دور</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-700 font-medium">
                      <div className="flex items-center gap-1">
                        <Home className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tower.planned_units_count} وحدة</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                      {tower.start_date}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                      {tower.expected_end_date}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <TowerStatusBadge status={tower.status} />
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="w-24">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                          <span>{tower.completion_rate}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-blue-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${tower.completion_rate}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <button
                            type="button"
                            id={`edit-tower-btn-${tower.id}`}
                            onClick={() => onOpenEditTowerModal(tower)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="تعديل البرج"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            id={`delete-tower-btn-${tower.id}`}
                            onClick={() => setTowerToDelete(tower)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

          <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>إجمالي الأبراج: <strong>{filteredTowers.length}</strong> مبنى</span>
            <span>مرتبطة بـ <strong>{projects.length}</strong> مشروعات</span>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Tower Deletion */}
      <ConfirmDialog
        isOpen={Boolean(towerToDelete)}
        title="تأكيد حذف البرج"
        message={`هل أنت متأكد من حذف برج "${towerToDelete?.name}" (كود: ${towerToDelete?.code})؟`}
        confirmText="نعم، حذف البرج"
        cancelText="إلغاء"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTowerToDelete(null)}
      />
    </div>
  );
};
