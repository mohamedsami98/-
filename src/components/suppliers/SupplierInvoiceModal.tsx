import React, { useState, useEffect } from 'react';
import { X, Receipt, Building2, Calendar, FileText, DollarSign } from 'lucide-react';
import { Supplier, Project, Tower } from '../../types';
import { dataService } from '../../lib/supabase';

interface SupplierInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  suppliers: Supplier[];
  defaultSupplierId?: string;
}

export const SupplierInvoiceModal: React.FC<SupplierInvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  defaultSupplierId,
}) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [filteredTowers, setFilteredTowers] = useState<Tower[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: defaultSupplierId || '',
    invoice_number: '',
    project_id: '',
    tower_id: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    category: 'building_materials',
    items_summary: '',
    subtotal: '',
    tax_amount: '0',
    discount_amount: '0',
    paid_amount: '0',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadProjectsAndTowers();
      if (defaultSupplierId) {
        setFormData((prev) => ({ ...prev, supplier_id: defaultSupplierId }));
      }
    }
  }, [isOpen, defaultSupplierId]);

  const loadProjectsAndTowers = async () => {
    try {
      const [projs, tows] = await Promise.all([
        dataService.getProjects(),
        dataService.getTowers(),
      ]);
      setProjects(projs);
      setTowers(tows);
    } catch (e) {
      console.error(e);
    }
  };

  const handleProjectChange = (projId: string) => {
    setFormData((prev) => ({ ...prev, project_id: projId, tower_id: '' }));
    if (projId) {
      setFilteredTowers(towers.filter((t) => t.project_id === projId));
    } else {
      setFilteredTowers([]);
    }
  };

  if (!isOpen) return null;

  const subtotalNum = Number(formData.subtotal || 0);
  const taxNum = Number(formData.tax_amount || 0);
  const discNum = Number(formData.discount_amount || 0);
  const totalAmount = subtotalNum + taxNum - discNum;
  const paidNum = Number(formData.paid_amount || 0);
  const remaining = Math.max(0, totalAmount - paidNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id || subtotalNum <= 0) return;

    const supplier = suppliers.find((s) => s.id === formData.supplier_id);
    const project = projects.find((p) => p.id === formData.project_id);
    const tower = towers.find((t) => t.id === formData.tower_id);

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        supplier_name: supplier?.name || '',
        project_name: project?.name || undefined,
        tower_name: tower?.name || undefined,
        subtotal: subtotalNum,
        tax_amount: taxNum,
        discount_amount: discNum,
        total_amount: totalAmount,
        paid_amount: paidNum,
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
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">تسجيل فاتورة توريد / مستخلص مقاول باطن</h3>
              <p className="text-xs text-slate-400">إثبات مديونية جديدة للمورد أو مستخلص أعمال وربطها بالمشروع</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                المورد / مقاول الباطن <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.supplier_id}
                onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.category_ar || s.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                رقم الفاتورة / المستخلص <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="مثال: INV-2025-104 أو مستخلص 4"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                المشروع المرتبط بالتوريد
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => handleProjectChange(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="">-- عام / غير مخصص لمشروع --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البرج التابع للمشروع
              </label>
              <select
                value={formData.tower_id}
                onChange={(e) => setFormData({ ...formData, tower_id: e.target.value })}
                disabled={!formData.project_id}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 disabled:opacity-40"
              >
                <option value="">-- البرج (اختياري) --</option>
                {filteredTowers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تاريخ الفاتورة / التوريد <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.invoice_date}
                onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                تاريخ استحقاق السداد
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                بيان المواد الموردة أو الأعمال المنفذة <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.items_summary}
                onChange={(e) => setFormData({ ...formData, items_summary: e.target.value })}
                placeholder="مثال: توريد 40 طن حديد تسليح 16 مم أو أعمال صب أعمدة الدور السادس"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            {/* Financials */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                المبلغ قبل الضريبة والخصم (ج.م) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="any"
                required
                value={formData.subtotal}
                onChange={(e) => setFormData({ ...formData, subtotal: e.target.value })}
                placeholder="0.00"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ضريبة القيمة المضافة / أعباء (إن وجدت)
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.tax_amount}
                onChange={(e) => setFormData({ ...formData, tax_amount: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                خصومات أو دفعات مقدمة سابقة
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                المبلغ المسدد حالياً من الفاتورة
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={formData.paid_amount}
                onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
                placeholder="0 إذا كانت الفاتورة آجلة"
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                dir="ltr"
              />
            </div>
          </div>

          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">إجمالي صافي الفاتورة المستحق:</span>
              <span className="text-lg font-bold text-amber-400">
                {totalAmount.toLocaleString()} ج.م
              </span>
            </div>
            <div className="text-left">
              <span className="text-xs text-slate-400 block">المتبقي على الشركة (الآجل):</span>
              <span className="text-lg font-bold text-rose-400">
                {remaining.toLocaleString()} ج.م
              </span>
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
              disabled={loading || subtotalNum <= 0}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 text-sm font-bold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
            >
              {loading ? 'جاري الحفظ...' : 'تسجيل الفاتورة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
