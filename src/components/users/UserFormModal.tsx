import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { User, Role } from '../../types';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../lib/supabase';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<void>;
  userToEdit?: User | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userToEdit,
}) => {
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const list = await dataService.getRoles();
        setRoles(list);
        if (!roleId && list.length > 0) {
          setRoleId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load roles', err);
      }
    };
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

  useEffect(() => {
    if (userToEdit) {
      setFullName(userToEdit.full_name);
      setEmail(userToEdit.email);
      setPhone(userToEdit.phone || '');
      setRoleId(userToEdit.role_id);
      setIsActive(userToEdit.status === 'active' || userToEdit.is_active !== false);
    } else {
      setFullName('');
      setEmail('');
      setPhone('');
      setIsActive(true);
    }
  }, [userToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !roleId) {
      error('يرجى ملء الحقول المطلوبة (الاسم الكامل، البريد الإلكتروني، والدور).');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        role_id: roleId,
        is_active: isActive,
      });
      onClose();
    } catch (err: any) {
      // handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={userToEdit ? `تعديل المستخدم: ${userToEdit.full_name}` : 'إضافة مستخدم جديد للنظام'}
      subtitle="تحديد بيانات الحساب والدور الوظيفي وصلاحيات الدخول"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4" dir="rtl">
        {/* Full Name */}
        <div>
          <label htmlFor="user-fullname-input" className="block text-xs font-bold text-slate-700 mb-1.5">
            الاسم الكامل <span className="text-rose-500">*</span>
          </label>
          <input
            id="user-fullname-input"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="مثال: م. أحمد عبد العزيز"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="user-email-input" className="block text-xs font-bold text-slate-700 mb-1.5">
            البريد الإلكتروني <span className="text-rose-500">*</span>
          </label>
          <input
            id="user-email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ahmed@company.com"
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
            dir="ltr"
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="user-phone-input" className="block text-xs font-bold text-slate-700 mb-1.5">
            رقم الهاتف (مصر)
          </label>
          <input
            id="user-phone-input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
            dir="ltr"
          />
        </div>

        {/* Role Selection */}
        <div>
          <label htmlFor="user-role-select" className="block text-xs font-bold text-slate-700 mb-1.5">
            الدور الوظيفي <span className="text-rose-500">*</span>
          </label>
          <select
            id="user-role-select"
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.is_system ? '(دور نظامي)' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Account Status Switch */}
        <div className="pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id="user-active-checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
            <div>
              <span className="text-xs font-bold text-slate-800">حساب نشط ومسموح له بتسجيل الدخول</span>
              <p className="text-[11px] text-slate-400">إذا تم إلغاء التفعيل فلن يتمكن المستخدم من تسجيل الدخول للنظام</p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20"
          >
            {loading ? 'جاري الحفظ...' : userToEdit ? 'حفظ التعديلات' : 'إضافة المستخدم'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
