import React, { useState, useEffect } from 'react';
import { X, CreditCard, Building2, Building, DollarSign, Calendar, FileText, CheckSquare, Clock } from 'lucide-react';
import { ContractInstallment, BankAccount, PaymentMethod } from '../../types';
import { financialService } from '../../lib/financialService';

interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (receiptData: any) => Promise<void>;
  installment?: ContractInstallment | null;
  installmentsList: ContractInstallment[];
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  installment,
  installmentsList,
}) => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Cheque specific fields
  const [chequeNumber, setChequeNumber] = useState<string>('');
  const [chequeBankName, setChequeBankName] = useState<string>('');
  const [chequeDueDate, setChequeDueDate] = useState<string>('');

  // Transfer specific fields
  const [transferRefNumber, setTransferRefNumber] = useState<string>('');
  const [receiptNumber, setReceiptNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const loadBanks = async () => {
      try {
        const accounts = await financialService.getBankAccounts();
        setBankAccounts(accounts);
        if (accounts.length > 0) {
          setBankAccountId(accounts[0].id);
        }
      } catch (err) {
        console.error('Error loading bank accounts', err);
      }
    };
    loadBanks();

    const target = installment || installmentsList.find((i) => i.status !== 'paid') || installmentsList[0];
    if (target) {
      setSelectedInstallmentId(target.id);
      const remaining = target.amount - (target.paid_amount || 0);
      setAmountPaid(String(remaining > 0 ? remaining : target.amount));
    }
    setReceiptNumber(`REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [isOpen, installment, installmentsList]);

  const activeInstallment = installmentsList.find((i) => i.id === selectedInstallmentId) || installment;

  const handleInstallmentChange = (id: string) => {
    setSelectedInstallmentId(id);
    const inst = installmentsList.find((i) => i.id === id);
    if (inst) {
      const remaining = inst.amount - (inst.paid_amount || 0);
      setAmountPaid(String(remaining > 0 ? remaining : inst.amount));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const paid = parseFloat(amountPaid);
    if (isNaN(paid) || paid <= 0) {
      setErrorMsg('يرجى إدخال مبلغ تحصيل صحيح أكبر من الصفر.');
      return;
    }
    if (paymentMethod === 'cheque' && !chequeNumber.trim()) {
      setErrorMsg('يرجى إدخال رقم الشيك البنكي.');
      return;
    }
    if (paymentMethod === 'cheque' && !chequeDueDate) {
      setErrorMsg('يرجى تحديد تاريخ استحقاق وصرف الشيك.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        installment_id: selectedInstallmentId,
        payment_date: paymentDate,
        amount_paid: paid,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId || undefined,
        cheque_number: paymentMethod === 'cheque' ? chequeNumber.trim() : undefined,
        cheque_bank_name: paymentMethod === 'cheque' ? chequeBankName.trim() : undefined,
        cheque_due_date: paymentMethod === 'cheque' ? chequeDueDate : undefined,
        cheque_status: paymentMethod === 'cheque' ? 'under_collection' : undefined,
        transfer_reference_number: paymentMethod === 'bank_transfer' ? transferRefNumber.trim() : undefined,
        receipt_number: receiptNumber.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية التحصيل.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">تحصيل قسط عقاري وإصدار سند قبض</h3>
              <p className="text-xs text-slate-300">إيداع نقدي أو تحويل بنكي أو شيك تحت التحصيل</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Installment Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">القسط المستحق للتحصيل *</label>
            <select
              value={selectedInstallmentId}
              onChange={(e) => handleInstallmentChange(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
            >
              {installmentsList.map((inst) => {
                const rem = inst.amount - (inst.paid_amount || 0);
                return (
                  <option key={inst.id} value={inst.id}>
                    قسط #{inst.installment_number} - {inst.client_name} (وحدة {inst.unit_number}، {inst.tower_name}) - متبقي: {rem.toLocaleString()} ج.م
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                المبلغ المحصل (ج.م) *
              </label>
              <input
                type="number"
                step="any"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                تاريخ التحصيل الفعلي *
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">طريقة سداد وتحصيل القسط *</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'bank_transfer'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                تحويل بنكي مباشر
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cheque')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'cheque'
                    ? 'border-amber-600 bg-amber-50 text-amber-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                شيك بنكي
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-2.5 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                نقداً بالخزينة
              </button>
            </div>
          </div>

          {/* Linked Bank Account */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {paymentMethod === 'cash' ? 'خزينة الإيداع النقدية *' : 'الحساب البنكي المودع به *'}
            </label>
            <select
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
            >
              {bankAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bank_name} - {acc.account_name} ({acc.account_type === 'cashbox' ? 'خزينة' : 'حساب بنكي'}) - الرصيد الحالي: {acc.balance.toLocaleString()} ج.م
                </option>
              ))}
            </select>
          </div>

          {/* Cheque Specific Fields */}
          {paymentMethod === 'cheque' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                بيانات الشيك البنكي
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">رقم الشيك *</label>
                  <input
                    type="text"
                    value={chequeNumber}
                    onChange={(e) => setChequeNumber(e.target.value)}
                    placeholder="مثال: CHQ-882910"
                    required
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">البنك المسحوب عليه *</label>
                  <input
                    type="text"
                    value={chequeBankName}
                    onChange={(e) => setChequeBankName(e.target.value)}
                    placeholder="مثال: البنك التجاري الدولي CIB"
                    required
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  تاريخ استحقاق وصرف الشيك *
                </label>
                <input
                  type="date"
                  value={chequeDueDate}
                  onChange={(e) => setChequeDueDate(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Transfer Reference */}
          {paymentMethod === 'bank_transfer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الحوالة أو السويفت / المرجع البنكي</label>
              <input
                type="text"
                value={transferRefNumber}
                onChange={(e) => setTransferRefNumber(e.target.value)}
                placeholder="مثال: TRF-2025-CIB-90214"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          {/* Receipt Number & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم سند القبض</label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات التحصيل</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: دفعة استلام المفتاح"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'جاري التحصيل...' : 'تأكيد التحصيل وإيداع المبلغ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
