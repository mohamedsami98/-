import React, { useState } from 'react';
import { X, Building2, User, Phone, Mail, MapPin, FileText, CreditCard } from 'lucide-react';
import { Supplier, SupplierCategory } from '../../types';

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  supplierToEdit?: Supplier | null;
}

const CATEGORIES: { value: SupplierCategory; label: string }[] = [
  { value: 'building_materials', label: 'مواد بناء وخرسانة وأسمنت' },
  { value: 'steel', label: 'حديد تسليح ومعدن' },
  { value: 'finishes', label: 'تشطيبات ودهانات وسيراميك' },
  { value: 'electrical_plumbing', label: 'كهرباء وصحي وتكييف' },
  { value: 'machinery_rental', label: 'معدات وأوناش وحفارات' },
  { value: 'subcontractor', label: 'مقاول باطن (مصنعيات ونجارة وحدادة)' },
  { value: 'engineering_services', label: 'استشارات وهندسة واختبارات' },
  { value: 'other', label: 'أخرى ومهمات عامة' },
];

export const SupplierFormModal: React.FC<SupplierFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplierToEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    code: supplierToEdit?.code || '',
    name: supplierToEdit?.name || '',
    company_name: supplierToEdit?.company_name || '',
    category: supplierToEdit?.category || 'building_materials',
    contact_person: supplierToEdit?.contact_person || '',
    phone: supplierToEdit?.phone || '',
    phone2: supplierToEdit?.phone2 || '',
    email: supplierToEdit?.email || '',
    address: supplierToEdit?.address || '',
    tax_number: supplierToEdit?.tax_number || '',
    commercial_registry: supplierToEdit?.commercial_registry || '',
    bank_name: supplierToEdit?.bank_name || '',
    bank_account_number: supplierToEdit?.bank_account_number || '',
    iban: supplierToEdit?.iban || '',
    notes: supplierToEdit?.notes || '',
    is_active: supplierToEdit?.is_active ?? true,
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const catObj = CATEGORIES.find((c) => c.value === formData.category);
      await onSubmit({
        ...formData,
        category_ar: catObj?.label || 'أخرى',
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {supplierToEdit ? 'تعديل بيانات المورد / مقاول الباطن' : 'إضافة مورد / مقاول باطن جديد'}
              </h3>
              <p className="text-xs text-slate-400">
                تسجيل بيانات المورد وحساباته البنكية لمتابعة التوريدات وسندات الصرف
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                اسم المورد / الشهرة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: شركة حديد عز أو مقاولات الحاج صلاح"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الاسم التجاري للشركة / السجل
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                placeholder="اسم الشركة المسجل رسمياً"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                نشاط وتخصص المورد <span className="text-rose-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as SupplierCategory })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                كود المورد
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="تلقائي (مثال: SUP-005)"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الشخص المسؤول / مندوب المبيعات <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                  placeholder="اسم الشخص للتواصل"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الهاتف الرئيسي <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="مثال: 01012345678"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم هاتف إضافي / واتساب
              </label>
              <input
                type="tel"
                value={formData.phone2}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                placeholder="012... أو هاتف أرضي"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="supplier@example.com"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الرقم الضريبي
              </label>
              <input
                type="text"
                value={formData.tax_number}
                onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                placeholder="مثال: 341-987-123"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم السجل التجاري
              </label>
              <input
                type="text"
                value={formData.commercial_registry}
                onChange={(e) => setFormData({ ...formData, commercial_registry: e.target.value })}
                placeholder="رقم السجل التجاري"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                العنوان والمقر
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="المدينة، المنطقة، الشارع"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>

            {/* Bank details */}
            <div className="md:col-span-2 pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                بيانات الحساب البنكي للمورد (لتحويل المستحقات)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">اسم البنك</label>
                  <input
                    type="text"
                    value={formData.bank_name}
                    onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                    placeholder="مثال: البنك الأهلي المصري"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">رقم الحساب</label>
                  <input
                    type="text"
                    value={formData.bank_account_number}
                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                    placeholder="رقم الحساب البنكي"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">رقم الآيبان (IBAN)</label>
                  <input
                    type="text"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                    placeholder="EG..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ملاحظات وشروط التعامل
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="شروط السداد، مدة التسهيلات، خطوط التوريد المعتمدة..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          {/* Action buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
            >
              {loading ? 'جاري الحفظ...' : supplierToEdit ? 'تحديث البيانات' : 'حفظ المورد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
