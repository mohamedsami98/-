import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Landmark, Calendar, User, FileText } from 'lucide-react';
import { Partner, Project, BankAccount, PaymentMethod } from '../../types';
import { financialService } from '../../lib/financialService';

interface PartnerDistributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  partners: Partner[];
  defaultPartnerId?: string;
  defaultProjectId?: string;
  suggestedAmount?: number;
}

export const PartnerDistributionModal: React.FC<PartnerDistributionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  partners,
  defaultPartnerId,
  defaultProjectId,
  suggestedAmount,
}) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [formData, setFormData] = useState({
    partner_id: defaultPartnerId || '',
    project_id: defaultProjectId || '',
    distribution_type: 'profit_payout' as 'profit_payout' | 'capital_refund' | 'withdrawal',
    amount: suggestedAmount ? String(suggestedAmount) : '',
    distribution_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer' as PaymentMethod,
    bank_account_id: '',
    transfer_reference: '',
    cheque_number: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (defaultPartnerId) setFormData((prev) => ({ ...prev, partner_id: defaultPartnerId }));
      if (defaultProjectId) setFormData((prev) => ({ ...prev, project_id: defaultProjectId }));
      if (suggestedAmount) setFormData((prev) => ({ ...prev, amount: String(suggestedAmount) }));
    }
  }, [isOpen, defaultPartnerId, defaultProjectId, suggestedAmount]);

  const loadInitialData = async () => {
    try {
      const accounts = await financialService.getBankAccounts();
      setBankAccounts(accounts.filter((a) => a.is_active));
      if (accounts.length > 0 && !formData.bank_account_id) {
        setFormData((prev) => ({ ...prev, bank_account_id: accounts[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;

  const currentPartner = partners.find((p) => p.id === formData.partner_id);
  const distAmount = Number(formData.amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partner_id || distAmount <= 0 || !formData.bank_account_id) return;

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        partner_name: currentPartner?.name || '',
        amount: distAmount,
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">صرف أرباح / مسحوبات لشريك</h3>
              <p className="text-xs text-slate-400">خصم الدفعة من حساب الشركة البنكي وتسجيل سند صرف رسمي</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الشريك المستفيد <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.partner_id}
                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">-- اختر الشريك --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (إجمالي استثماره: {p.total_invested.toLocaleString()} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  نوع الحركة <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.distribution_type}
                  onChange={(e) => setFormData({ ...formData, distribution_type: e.target.value as any })}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="profit_payout">صرف أرباح دورية / سنوية</option>
                  <option value="withdrawal">مسحوبات تحت الحساب</option>
                  <option value="capital_refund">استرداد جزء من رأس المال</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  مبلغ الصرف (ج.م) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-bold text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  تاريخ الصرف <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.distribution_date}
                  onChange={(e) => setFormData({ ...formData, distribution_date: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  طريقة السداد <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value as PaymentMethod })}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="bank_transfer">تحويل بنكي</option>
                  <option value="cheque">شيك بنكي</option>
                  <option value="cash">نقداً من الخزينة</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                الحساب المسحوب منه <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.bank_account_id}
                onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">-- اختر الحساب أو الخزينة --</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - الرصيد: {acc.balance.toLocaleString()} ج.م
                  </option>
                ))}
              </select>
            </div>

            {formData.payment_method === 'bank_transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم مرجع التحويل
                </label>
                <input
                  type="text"
                  value={formData.transfer_reference}
                  onChange={(e) => setFormData({ ...formData, transfer_reference: e.target.value })}
                  placeholder="رقم الحوالة البنكية"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
              </div>
            )}

            {formData.payment_method === 'cheque' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الشيك البنكي
                </label>
                <input
                  type="text"
                  value={formData.cheque_number}
                  onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                  placeholder="رقم الشيك الصادر للشريك"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                ملاحظات
              </label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="بيان التوزيع أو الفترة المالية الخاصة به..."
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
              disabled={loading || distAmount <= 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {loading ? 'جاري الصرف...' : 'تأكيد وصرف سند الأرباح'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
