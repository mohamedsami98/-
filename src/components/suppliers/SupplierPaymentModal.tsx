import React, { useState, useEffect } from 'react';
import { X, CreditCard, Landmark, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';
import { Supplier, SupplierInvoice, BankAccount, PaymentMethod } from '../../types';
import { financialService } from '../../lib/financialService';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  suppliers: Supplier[];
  defaultSupplierId?: string;
  defaultInvoiceId?: string;
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  suppliers,
  defaultSupplierId,
  defaultInvoiceId,
}) => {
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [supplierInvoices, setSupplierInvoices] = useState<SupplierInvoice[]>([]);

  const [formData, setFormData] = useState({
    supplier_id: defaultSupplierId || '',
    invoice_id: defaultInvoiceId || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer' as PaymentMethod,
    bank_account_id: '',
    transfer_reference: '',
    cheque_number: '',
    cheque_bank_name: '',
    cheque_due_date: '',
    description: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadBankAccounts();
      if (defaultSupplierId) {
        setFormData((prev) => ({ ...prev, supplier_id: defaultSupplierId }));
        loadInvoices(defaultSupplierId);
      }
    }
  }, [isOpen, defaultSupplierId]);

  const loadBankAccounts = async () => {
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

  const loadInvoices = async (supId: string) => {
    try {
      const invs = await financialService.getSupplierInvoices(supId);
      setSupplierInvoices(invs.filter((i) => i.status !== 'paid'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSupplierChange = (supId: string) => {
    setFormData((prev) => ({ ...prev, supplier_id: supId, invoice_id: '' }));
    if (supId) {
      loadInvoices(supId);
    } else {
      setSupplierInvoices([]);
    }
  };

  const handleInvoiceChange = (invId: string) => {
    setFormData((prev) => ({ ...prev, invoice_id: invId }));
    const inv = supplierInvoices.find((i) => i.id === invId);
    if (inv) {
      setFormData((prev) => ({
        ...prev,
        invoice_id: invId,
        amount: String(inv.remaining_amount || inv.total_amount),
        description: `سداد فاتورة رقم ${inv.invoice_number} - ${inv.items_summary}`,
      }));
    }
  };

  if (!isOpen) return null;

  const currentSupplier = suppliers.find((s) => s.id === formData.supplier_id);
  const selectedAccount = bankAccounts.find((a) => a.id === formData.bank_account_id);
  const payAmount = Number(formData.amount || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplier_id || payAmount <= 0 || !formData.bank_account_id) return;

    if (selectedAccount && selectedAccount.balance < payAmount) {
      const confirmLowBalance = window.confirm(
        `تنبيه: رصيد الحساب المختار (${selectedAccount.balance.toLocaleString()} ج.م) أقل من مبلغ السداد (${payAmount.toLocaleString()} ج.م). هل تريد المتابعة والسحب على المكشوف؟`
      );
      if (!confirmLowBalance) return;
    }

    setLoading(true);
    try {
      const inv = supplierInvoices.find((i) => i.id === formData.invoice_id);
      await onSubmit({
        ...formData,
        supplier_name: currentSupplier?.name || '',
        invoice_number: inv?.invoice_number || undefined,
        amount: payAmount,
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">إصدار سند صرف / سداد لمورد</h3>
              <p className="text-xs text-slate-400">صرف دفعة أو سداد فاتورة مع الخصم الفوري من الحساب البنكي / الخزينة</p>
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
                المورد المستفيد <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.supplier_id}
                onChange={(e) => handleSupplierChange(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} (المستحق له: {s.current_balance.toLocaleString()} ج.م)
                  </option>
                ))}
              </select>
            </div>

            {supplierInvoices.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  سداد فاتورة محددة (اختياري)
                </label>
                <select
                  value={formData.invoice_id}
                  onChange={(e) => handleInvoiceChange(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="">-- دفعة تحت الحساب (بدون ربط بفاتورة) --</option>
                  {supplierInvoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      فاتورة {inv.invoice_number} - متبقي {inv.remaining_amount.toLocaleString()} ج.م ({inv.items_summary})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  مبلغ السداد (ج.م) <span className="text-rose-400">*</span>
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

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  تاريخ الصرف <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.payment_date}
                  onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
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
            </div>

            {formData.payment_method === 'bank_transfer' && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الحوالة البنكية / المرجع
                </label>
                <input
                  type="text"
                  value={formData.transfer_reference}
                  onChange={(e) => setFormData({ ...formData, transfer_reference: e.target.value })}
                  placeholder="رقم مرجع التحويل البنكي"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  dir="ltr"
                />
              </div>
            )}

            {formData.payment_method === 'cheque' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">رقم الشيك</label>
                  <input
                    type="text"
                    required
                    value={formData.cheque_number}
                    onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
                    placeholder="رقم الشيك"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">البنك المسحوب عليه</label>
                  <input
                    type="text"
                    value={formData.cheque_bank_name}
                    onChange={(e) => setFormData({ ...formData, cheque_bank_name: e.target.value })}
                    placeholder="اسم البنك"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={formData.cheque_due_date}
                    onChange={(e) => setFormData({ ...formData, cheque_due_date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                البيان المحاسبي لسند الصرف <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="مثال: سداد دفعة تحت حساب توريدات حديد أو سداد مستخلص 6"
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
              disabled={loading || payAmount <= 0}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
            >
              {loading ? 'جاري الصرف...' : 'إصدار سند الصرف وخصم المبلغ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
