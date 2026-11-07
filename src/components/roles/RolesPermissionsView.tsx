import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  Check, 
  X, 
  Save, 
  Lock, 
  AlertCircle, 
  Users, 
  Settings,
  RefreshCw
} from 'lucide-react';
import { Role, Permission, SystemModule, PermissionAction } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const MODULE_NAMES: Record<SystemModule, string> = {
  dashboard: 'لوحة التحكم',
  projects: 'إدارة المشروعات',
  towers: 'إدارة الأبراج',
  costs: 'التكاليف والمصروفات',
  inventory: 'المخازن والمواد الخام',
  installments: 'تحصيل الأقساط',
  reports: 'تقارير الأقساط والتحصيل',
  banking: 'الحسابات البنكية والخزائن',
  suppliers: 'الموردون ومقاولو الباطن',
  partners: 'الشركاء وحسابات رأس المال والأرباح',
  users: 'إدارة المستخدمين',
  roles_permissions: 'الأدوار والصلاحيات',
  activity_logs: 'سجل النشاط والعمليات',
  settings: 'الإعدادات العامة والربط',
};

const ACTION_NAMES: Record<PermissionAction, string> = {
  view: 'عرض',
  create: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  approve: 'اعتماد',
  print: 'طباعة',
  export: 'تصدير',
};

export const RolesPermissionsView: React.FC = () => {
  const { user, role: currentRole, refreshUserRole, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<string[]>([]); // permission codes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canEditPermissions = hasPermission('roles_permissions', 'edit');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rList, pList] = await Promise.all([
        dataService.getRoles(),
        dataService.getPermissions(),
      ]);
      setRoles(rList);
      setPermissions(pList);
      if (rList.length > 0) {
        const initialId = selectedRoleId || rList[0].id;
        setSelectedRoleId(initialId);
        const pCodes = await dataService.getRolePermissions(initialId);
        setRolePermissions(pCodes);
      }
    } catch (err) {
      console.error('Failed to load roles and permissions', err);
      error('حدث خطأ أثناء تحميل بيانات الصلاحيات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectRole = async (roleId: string) => {
    setSelectedRoleId(roleId);
    try {
      const pCodes = await dataService.getRolePermissions(roleId);
      setRolePermissions(pCodes);
    } catch (err) {
      console.error('Failed to fetch role permissions', err);
    }
  };

  const handleTogglePermission = (permissionCode: string) => {
    if (!canEditPermissions) {
      error('ليس لديك صلاحية لتعديل مصفوفة الصلاحيات.');
      return;
    }
    setRolePermissions((prev) => {
      if (prev.includes(permissionCode)) {
        return prev.filter((c) => c !== permissionCode);
      } else {
        return [...prev, permissionCode];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      const activeUser = user || { id: 'admin', full_name: 'مدير النظام' };
      await dataService.updateRolePermissions(selectedRoleId, rolePermissions, activeUser);
      success('تم حفظ وتحديث صلاحيات الدور بنجاح.');
      await refreshUserRole();
    } catch (err: any) {
      error(err.message || 'فشل حفظ الصلاحيات.');
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);
  const isSuperAdmin = selectedRole?.key === 'system_admin' || selectedRole?.key === 'super_admin';

  const modulesList: SystemModule[] = [
    'dashboard',
    'projects',
    'towers',
    'users',
    'roles_permissions',
    'activity_logs',
    'settings',
  ];

  const actionsList: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'print', 'export'];

  if (loading) {
    return <LoadingSpinner message="جاري تحميل مصفوفة الصلاحيات والأدوار..." />;
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            إدارة الأدوار ومصفوفة الصلاحيات (RBAC)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            التحكم في وصول ومسؤوليات أعضاء الفريق طبقاً للهيكل الإداري والهندسي لشركة المقاولات
          </p>
        </div>

        {canEditPermissions && (
          <button
            type="button"
            id="save-permissions-matrix-btn"
            onClick={handleSavePermissions}
            disabled={saving || isSuperAdmin}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات في الصلاحيات'}</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Roles List (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>الأدوار الوظيفية المتاحة</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                {roles.length}
              </span>
            </h3>

            <div className="space-y-1.5" id="roles-list-container">
              {roles.map((r) => {
                const isSelected = r.id === selectedRoleId;
                const roleKey = r.key || r.code || r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    id={`role-btn-${roleKey}`}
                    onClick={() => handleSelectRole(r.id)}
                    className={`w-full text-right p-3.5 rounded-2xl transition-all flex items-center justify-between border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                        : 'bg-slate-50/70 hover:bg-slate-100 border-slate-100 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm">{r.name}</div>
                      <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                        {r.description}
                      </div>
                    </div>
                    {isSelected ? (
                      <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/70 text-slate-600 border border-slate-200">
                        {roleKey}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick RBAC Explanatory Note */}
          <div className="bg-blue-50/70 rounded-3xl p-5 border border-blue-100 text-xs text-blue-900 leading-relaxed">
            <div className="flex items-center gap-2 font-bold mb-1.5">
              <Lock className="w-4 h-4 text-blue-600" />
              <span>قواعد الأمان والـ RBAC:</span>
            </div>
            <p>
              يتم إخفاء أزرار الإجراءات (كالحذف والإضافة والتعديل) تلقائياً عن المستخدمين الذين لا يمتلكون الصلاحية. كما يتم حظر مسار الصفحة عند الدخول المباشر.
            </p>
          </div>
        </div>

        {/* Right: Permissions Matrix Table (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  صلاحيات: {selectedRole?.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  حدد الصلاحيات المسموح بها لهذا الدور عبر شاشات النظام المختلفة
                </p>
              </div>

              {isSuperAdmin && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>كامل الصلاحيات (دور سيادي)</span>
                </span>
              )}
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs sm:text-sm" id="permissions-matrix-table">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-slate-700 font-bold">
                    <th className="py-3 px-4">الشاشة / الموديول</th>
                    {actionsList.map((act) => (
                      <th key={act} className="py-3 px-3 text-center">
                        {ACTION_NAMES[act]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modulesList.map((mod) => {
                    return (
                      <tr key={mod} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {MODULE_NAMES[mod]}
                        </td>

                        {actionsList.map((act) => {
                          const permCode = `${mod}:${act}`;
                          const isGranted = isSuperAdmin || rolePermissions.includes(permCode);

                          return (
                            <td key={act} className="py-3.5 px-3 text-center">
                              <button
                                type="button"
                                id={`perm-toggle-${mod}-${act}`}
                                onClick={() => handleTogglePermission(permCode)}
                                disabled={!canEditPermissions || isSuperAdmin}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                  isGranted
                                    ? 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600'
                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-500'
                                } ${(!canEditPermissions || isSuperAdmin) ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                title={`${isGranted ? 'ممنوحة' : 'محجوبة'} - ${MODULE_NAMES[mod]}: ${ACTION_NAMES[act]}`}
                              >
                                {isGranted ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <X className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
                <span>مسموح</span>
              </span>
              <span className="flex items-center gap-1.5 text-slate-400 font-medium">
                <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
                <span>محجوب</span>
              </span>
            </div>
            <span>إجمالي الموديولات المدعومة: {modulesList.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
