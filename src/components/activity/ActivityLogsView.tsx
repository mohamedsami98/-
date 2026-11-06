import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Search, 
  Clock, 
  Download, 
  Printer, 
  User, 
  Layers, 
  Building2, 
  Building, 
  Shield, 
  Settings,
  Filter
} from 'lucide-react';
import { ActivityLog } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import { dataService } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';

export const ActivityLogsView: React.FC = () => {
  const { success, error } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await dataService.getActivityLogs(200);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
      error('حدث خطأ أثناء تحميل سجل العمليات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        l.description.toLowerCase().includes(q) ||
        l.user_name.toLowerCase().includes(q) ||
        (l.record_id && l.record_id.toLowerCase().includes(q));

      const actionType = l.action_type || l.action || '';
      const matchesModule = moduleFilter === 'all' || l.module === moduleFilter;
      const matchesAction = actionFilter === 'all' || actionType === actionFilter;

      return matchesSearch && matchesModule && matchesAction;
    });
  }, [logs, searchQuery, moduleFilter, actionFilter]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      error('لا توجد سجلات نشاط لتصديرها.');
      return;
    }
    const headers = ['التوقيت', 'المستخدم', 'القسم', 'نوع العملية', 'الوصف', 'معرف السجل', 'عنوان IP'];
    const rows = filteredLogs.map((l) => [
      `"${l.created_at}"`,
      `"${l.user_name}"`,
      l.module,
      l.action_type || l.action || '',
      `"${l.description.replace(/"/g, '""')}"`,
      l.record_id || '',
      l.ip_address || '127.0.0.1'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `سجل_عمليات_النظام_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير سجل النشاط بنجاح.');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            سجل النشاط والعمليات (Audit Logs)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تسجيل وتوثيق كافة العمليات الهندسية والإدارية ومتابعة الأمان والوصول
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="export-logs-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">تصدير CSV</span>
          </button>

          <button
            type="button"
            id="print-logs-btn"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="logs-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالوصف، اسم المستخدم، أو معرف السجل..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* Module Filter */}
        <div className="w-full md:w-48 flex-shrink-0">
          <select
            id="logs-module-filter"
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">كافة الأقسام والموديولات</option>
            <option value="projects">المشروعات</option>
            <option value="towers">الأبراج</option>
            <option value="users">المستخدمون</option>
            <option value="roles_permissions">الأدوار والصلاحيات</option>
            <option value="auth">تسجيل الدخول والأمان</option>
            <option value="settings">الإعدادات</option>
          </select>
        </div>

        {/* Action Type Filter */}
        <div className="w-full md:w-44 flex-shrink-0">
          <select
            id="logs-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">كافة الإجراءات</option>
            <option value="create">إنشاء وإضافة</option>
            <option value="update">تعديل وتحديث</option>
            <option value="delete">حذف</option>
            <option value="login">تسجيل دخول</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      {loading ? (
        <LoadingSpinner message="جاري جلب سجل العمليات..." />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          id="empty-activity-logs"
          title="لا توجد عمليات مطابقة"
          description="لم يتم العثور على أي نشاط مطابق للفلاتر الحالية."
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs sm:text-sm" id="activity-logs-table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-bold">
                  <th className="py-4 px-4 sm:px-6">توقيت العملية</th>
                  <th className="py-4 px-4">المستخدم</th>
                  <th className="py-4 px-4">القسم</th>
                  <th className="py-4 px-4">نوع الإجراء</th>
                  <th className="py-4 px-4">تفاصيل وبيان العملية</th>
                  <th className="py-4 px-4">معرف السجل</th>
                  <th className="py-4 px-4">عنوان IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const date = new Date(log.created_at);
                  const timeStr = date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  const dateStr = date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });

                  const actionType = (log.action_type || log.action || '') as string;
                  let actionBadgeColor = 'bg-slate-100 text-slate-700';
                  if (actionType === 'create') actionBadgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                  if (actionType === 'update') actionBadgeColor = 'bg-amber-50 text-amber-700 border border-amber-200';
                  if (actionType === 'delete') actionBadgeColor = 'bg-rose-50 text-rose-700 border border-rose-200';
                  if (actionType === 'auth' || actionType === 'login') actionBadgeColor = 'bg-blue-50 text-blue-700 border border-blue-200';

                  return (
                    <tr key={log.id} id={`log-row-${log.id}`} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                        <div>{dateStr}</div>
                        <div className="text-[11px] text-slate-400">{timeStr}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                            {log.user_name.charAt(0)}
                          </div>
                          <span>{log.user_name}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-700">
                          {log.module}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${actionBadgeColor}`}>
                          {actionType}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-800 leading-relaxed font-medium">
                        {log.description}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-500" dir="ltr">
                        {log.record_id || '—'}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-mono text-xs text-slate-400" dir="ltr">
                        {log.ip_address || '127.0.0.1'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
