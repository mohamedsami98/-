import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Edit3, 
  Trash2, 
  Shield, 
  Phone, 
  Mail, 
  CheckCircle, 
  XCircle,
  Clock,
  Download
} from 'lucide-react';
import { User, Role } from '../../types';
import { UserRoleBadge } from '../common/Badge';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

interface UsersListProps {
  onOpenNewUserModal: () => void;
  onOpenEditUserModal: (user: User) => void;
}

export const UsersList: React.FC<UsersListProps> = ({
  onOpenNewUserModal,
  onOpenEditUserModal,
}) => {
  const { user: currentUser, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Deletion
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canCreate = hasPermission('users', 'create');
  const canEdit = hasPermission('users', 'edit');
  const canDelete = hasPermission('users', 'delete');
  const canExport = hasPermission('users', 'export');

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, rList] = await Promise.all([
        dataService.getUsers(),
        dataService.getRoles(),
      ]);
      setUsers(uList);
      setRoles(rList);
    } catch (err) {
      console.error('Failed to load users', err);
      error('حدث خطأ أثناء تحميل المستخدمين.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteConfirm = async () => {
    if (!userToDelete || !currentUser) return;
    if (userToDelete.id === currentUser.id) {
      error('لا يمكنك حذف حسابك الحالي المسجل به في النظام.');
      setUserToDelete(null);
      return;
    }
    setIsDeleting(true);
    try {
      await dataService.deleteUser(userToDelete.id, currentUser);
      success(`تم حذف المستخدم "${userToDelete.full_name}" بنجاح.`);
      setUserToDelete(null);
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل حذف المستخدم.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        u.full_name.toLowerCase().includes(query) ||
        u.email.toLowerCase().includes(query) ||
        (u.phone && u.phone.includes(query));

      const matchesRole = roleFilter === 'all' || u.role_id === roleFilter;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && u.is_active) ||
        (statusFilter === 'inactive' && !u.is_active);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) {
      error('لا توجد بيانات لتصديرها.');
      return;
    }
    const headers = ['الاسم الكامل', 'البريد الإلكتروني', 'رقم الهاتف', 'الدور', 'الحالة', 'تاريخ الإنشاء', 'آخر دخول'];
    const rows = filteredUsers.map((u) => [
      `"${u.full_name}"`,
      u.email,
      u.phone || '',
      `"${u.role_name || ''}"`,
      u.is_active ? 'نشط' : 'غير نشط',
      u.created_at,
      u.last_login_at || 'لم يسجل دخول بعد'
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `مستخدمو_النظام_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('تم تصدير قائمة المستخدمين بنجاح.');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            إدارة المستخدمين وحسابات العمل
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            إدارة حسابات المهندسين والمحاسبين ومديري المشروعات والتحكم في حالات الحسابات
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canExport && (
            <button
              type="button"
              id="export-users-btn"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">تصدير CSV</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              id="add-new-user-btn"
              onClick={onOpenNewUserModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة مستخدم جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            id="users-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث بالاسم أو البريد الإلكتروني أو الهاتف..."
            className="w-full pl-4 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
          />
        </div>

        {/* Role Filter */}
        <div className="w-full md:w-56 flex-shrink-0">
          <select
            id="users-role-filter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">كافة الأدوار الوظيفية</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-44 flex-shrink-0">
          <select
            id="users-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">كافة الحالات</option>
            <option value="active">نشط فقط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner message="جاري جلب حسابات المستخدمين..." />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          id="empty-users-list"
          title="لا يوجد مستخدمون مطابقون"
          description="جرب البحث بكلمة أخرى أو قم بإضافة مستخدم جديد."
          actionText={canCreate ? 'إضافة مستخدم' : undefined}
          onAction={onOpenNewUserModal}
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse" id="users-table">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6">المستخدم</th>
                  <th className="py-4 px-4">البريد الإلكتروني</th>
                  <th className="py-4 px-4">رقم الهاتف</th>
                  <th className="py-4 px-4">الدور الوظيفي</th>
                  <th className="py-4 px-4">الحالة</th>
                  <th className="py-4 px-4">تاريخ الإنشاء</th>
                  <th className="py-4 px-4">آخر تسجيل دخول</th>
                  <th className="py-4 px-4 sm:px-6 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u.id} id={`user-row-${u.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {u.full_name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.full_name}</div>
                          {currentUser?.id === u.id && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                              (أنت - الجلسة الحالية)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                      {u.email}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-600 font-mono text-xs" dir="ltr">
                      {u.phone || '—'}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      <UserRoleBadge roleName={u.role_name || 'موظف'} />
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          <span>نشط</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3" />
                          <span>غير نشط</span>
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 font-mono text-xs" dir="ltr">
                      {new Date(u.created_at).toLocaleDateString('ar-EG')}
                    </td>

                    <td className="py-4 px-4 whitespace-nowrap text-slate-500 text-xs">
                      {u.last_login_at ? (
                        <span className="font-mono" dir="ltr">
                          {new Date(u.last_login_at).toLocaleDateString('ar-EG')}
                        </span>
                      ) : (
                        <span className="text-slate-400">لم يسجل دخول</span>
                      )}
                    </td>

                    <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {canEdit && (
                          <button
                            type="button"
                            id={`edit-user-btn-${u.id}`}
                            onClick={() => onOpenEditUserModal(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                            title="تعديل المستخدم"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && currentUser?.id !== u.id && (
                          <button
                            type="button"
                            id={`delete-user-btn-${u.id}`}
                            onClick={() => setUserToDelete(u)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="حذف المستخدم"
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
        </div>
      )}

      {/* Delete User Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(userToDelete)}
        title="تأكيد حذف المستخدم"
        message={`هل أنت متأكد من حذف حساب "${userToDelete?.full_name}" (${userToDelete?.email})؟`}
        confirmText="نعم، حذف الحساب"
        cancelText="إلغاء"
        isDestructive={true}
        loading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
