import React, { useState } from 'react';
import { X, Users, User, Phone, Mail, MapPin, CreditCard, Shield } from 'lucide-react';
import { Partner, PartnerType } from '../../types';

interface PartnerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  partnerToEdit?: Partner | null;
}

const PARTNER_TYPES: { value: PartnerType; label: string; desc: string }[] = [
  { value: 'capital_investor', label: 'شريك ممول برأس مال', desc: 'مساهمة مالية نقدية في مشروعات محددة' },
  { value: 'founding_partner', label: 'شريك مؤسس', desc: 'شريك مؤسس بحصة ثابتة في الشركة' },
  { value: 'land_partner', label: 'شريك بالأرض / عيني', desc: 'مساهمة بقطعة أرض المشروع أو أصول عينية' },
  { value: 'managing_partner', label: 'شريك تنفيذي وإداري', desc: 'إدارة المشروعات والتشغيل' },
  { value: 'other', label: 'شريك آخر', desc: 'شراكة خاصة' },
];

export const PartnerFormModal: React.FC<PartnerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  partnerToEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: partnerToEdit?.code || '',
    name: partnerToEdit?.name || '',
    partner_type: partnerToEdit?.partner_type || 'capital_investor',
    national_id: partnerToEdit?.national_id || '',
    phone: partnerToEdit?.phone || '',
    email: partnerToEdit?.email || '',
    address: partnerToEdit?.address || '',
    bank_name: partnerToEdit?.bank_name || '',
    bank_account_number: partnerToEdit?.bank_account_number || '',
    iban: partnerToEdit?.iban || '',
    notes: partnerToEdit?.notes || '',
    is_active: partnerToEdit?.is_active ?? true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;

    setLoading(true);
    try {
      const typeObj = PARTNER_TYPES.find((t) => t.value === formData.partner_type);
      await onSubmit({
        ...formData,
        partner_type_ar: typeObj?.label || 'شريك ممول',
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {partnerToEdit ? 'تعديل بيانات الشريك' : 'إضافة شريك استثماري جديد'}
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل بيانات الشريك وصفة الشراكة وحساباته البنكية لتحويل الأرباح
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم الشريك الكامل <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: الحاج عبد الرحيم الدسوقي"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                صفة ونوع الشراكة <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.partner_type}
                onChange={(e) => setFormData({ ...formData, partner_type: e.target.value as PartnerType })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {PARTNER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كود الشريك
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="تلقائي (مثال: PRT-001)"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الهاتف <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="010..."
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الرقم القومي (14 رقم)
              </label>
              <input
                type="text"
                value={formData.national_id}
                onChange={(e) => setFormData({ ...formData, national_id: e.target.value })}
                placeholder="29801..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                dir="ltr"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@example.com"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                العنوان ومحل الإقامة
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="المدينة، الحي، المحافظة"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>

            {/* Bank details for payouts */}
            <div className="md:col-span-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                الحساب البنكي للشريك (لتحويل توزيعات الأرباح)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">اسم البنك</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="مثال: البنك الأهلي المصري"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">رقم الحساب</label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    placeholder="رقم الحساب"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">الآيبان IBAN</label>
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="EG..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ملاحظات
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="أي شروط أو تفاصيل إضافية..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              {loading ? 'جاري الحفظ...' : partnerToEdit ? 'تحديث البيانات' : 'حفظ الشريك'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
