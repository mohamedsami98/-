import React, { useState, useEffect, useMemo } from 'react';
import { 
  CreditCard, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Printer, 
  Calendar, 
  Building, 
  UserCheck, 
  Plus,
  ArrowDownLeft,
  Filter
} from 'lucide-react';
import { ContractInstallment, InstallmentPaymentReceipt, InstallmentStatus, BankAccount } from '../../types';
import { financialService } from '../../lib/financialService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CollectPaymentModal } from './CollectPaymentModal';
import { ReceiptPrintModal } from './ReceiptPrintModal';

export const InstallmentsView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [installments, setInstallments] = useState<ContractInstallment[]>([]);
  const [receipts, setReceipts] = useState<InstallmentPaymentReceipt[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'receipts' | 'cheques'>('schedule');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isCollectModalOpen, setIsCollectModalOpen] = useState<boolean>(false);
  const [selectedInstallment, setSelectedInstallment] = useState<ContractInstallment | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<InstallmentPaymentReceipt | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [insts, recs, banks] = await Promise.all([
        financialService.getInstallments(),
        financialService.getReceipts(),
        financialService.getBankAccounts(),
      ]);
      setInstallments(insts);
      setReceipts(recs);
      setBankAccounts(banks);
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تحميل بيانات الأقساط وسندات القبض.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered installments
  const filteredInstallments = useMemo(() => {
    return installments.filter((inst) => {
      const matchStatus = statusFilter === 'all' || inst.status === statusFilter;
      const matchSearch = searchTerm === '' ||
        inst.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.tower_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.unit_number.toLowerCase().includes(searchTerm.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [installments, statusFilter, searchTerm]);

  // Filtered receipts
  const filteredReceipts = useMemo(() => {
    return receipts.filter((rec) => {
      return (
        searchTerm === '' ||
        rec.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.cheque_number && rec.cheque_number.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  }, [receipts, searchTerm]);

  // Cheques under collection
  const chequesUnderCollection = useMemo(() => {
    return receipts.filter((r) => r.payment_method === 'cheque' && r.cheque_status === 'under_collection');
  }, [receipts]);

  // KPIs
  const totalContractualAmount = useMemo(() => {
    return installments.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  }, [installments]);

  const totalCollectedAmount = useMemo(() => {
    return installments.reduce((sum, i) => sum + Number(i.paid_amount || 0), 0);
  }, [installments]);

  const totalPendingCheques = useMemo(() => {
    return chequesUnderCollection.reduce((sum, r) => sum + Number(r.amount_paid || r.amount || 0), 0);
  }, [chequesUnderCollection]);

  const remainingBalance = totalContractualAmount - totalCollectedAmount;

  // Actions
  const handleCollectSubmit = async (receiptData: any) => {
    if (!user) return;
    try {
      const res = await financialService.collectInstallmentPayment(receiptData, user);
      const paidVal = Number(res.amount_paid || res.amount || 0);
      success(`تم تحصيل مبلغ ${paidVal.toLocaleString()} ج.م بنجاح وإصدار سند قبض رقم ${res.receipt_number}.`);
      await loadData();
      setReceiptToPrint(res);
    } catch (err: any) {
      error(err.message || 'فشلت عملية التحصيل.');
    }
  };

  const handleClearCheque = async (receiptId: string, bankAccountId: string) => {
    if (!user) return;
    if (!window.confirm('هل تم إيداع الشيك والتأكد من صرفه بحساب الشركة البنكي؟')) return;
    try {
      await financialService.clearCheque(receiptId, bankAccountId, user);
      success('تم تأكيد صرف الشيك وزيادة رصيد الحساب البنكي بنجاح.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشلت عملية صرف الشيك.');
    }
  };

  const openCollectForInstallment = (inst: ContractInstallment) => {
    setSelectedInstallment(inst);
    setIsCollectModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">كافة الحالات</option>
              <option value="pending">أقساط مستحقة القيد</option>
              <option value="paid">أقساط مسددة بالكامل</option>
              <option value="partially_paid">أقساط مسددة جزئياً</option>
              <option value="overdue">أقساط متأخرة</option>
            </select>
          </div>
        </div>

        {/* Action Button */}
        {hasPermission('installments', 'create') && (
          <button
            type="button"
            id="collect-payment-btn"
            onClick={() => {
              setSelectedInstallment(null);
              setIsCollectModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>تحصيل قسط / سند قبض جديد</span>
          </button>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي الأقساط التعاقدية</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {totalContractualAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {installments.length} قسط مسجل بعقود البيع
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المحصل الفعلي</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">
            {totalCollectedAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-emerald-700 font-semibold">
            نسبة التحصيل: {totalContractualAmount > 0 ? Math.round((totalCollectedAmount / totalContractualAmount) * 100) : 0}%
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">شيكات تحت التحصيل</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">
            {totalPendingCheques.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {chequesUnderCollection.length} شيك بنكي لم يحصل بعد
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">المتبقي غير المحصل</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-purple-600">
            {remainingBalance.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            أقساط مستقبلية مستحقة
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'schedule'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          جدول الأقساط التعاقدية ({filteredInstallments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'receipts'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سندات القبض المعتمدة ({filteredReceipts.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cheques')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cheques'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          حافظة الشيكات البنكية ({chequesUnderCollection.length})
        </button>
      </div>

      {/* TAB 1: INSTALLMENT SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث باسم العميل أو البرج أو رقم الوحدة..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500">
              عدد الأقساط: <span className="font-bold text-slate-800">{filteredInstallments.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم القسط</th>
                  <th className="p-3.5">العميل المشتري</th>
                  <th className="p-3.5">البرج والوحدة</th>
                  <th className="p-3.5">تاريخ الاستحقاق</th>
                  <th className="p-3.5">قيمة القسط</th>
                  <th className="p-3.5">المسدد منه</th>
                  <th className="p-3.5">المتبقي</th>
                  <th className="p-3.5">حالة السداد</th>
                  <th className="p-3.5 text-center">تحصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredInstallments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا توجد أقساط مطابقة للبحث أو معايير الفلترة.
                    </td>
                  </tr>
                ) : (
                  filteredInstallments.map((inst) => {
                    const remaining = inst.amount - (inst.paid_amount || 0);
                    return (
                      <tr key={inst.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                          قسط #{inst.installment_number}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {inst.client_name}
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{inst.tower_name}</div>
                          <div className="text-[11px] text-slate-500">وحدة رقم {inst.unit_number}</div>
                        </td>
                        <td className="p-3.5 text-slate-600 whitespace-nowrap font-medium">
                          {inst.due_date}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {Number(inst.amount).toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 font-bold text-emerald-600 whitespace-nowrap">
                          {Number(inst.paid_amount || 0).toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 font-bold text-rose-600 whitespace-nowrap">
                          {remaining.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            inst.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inst.status === 'partially_paid'
                              ? 'bg-blue-100 text-blue-800'
                              : inst.status === 'overdue'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inst.status === 'paid' ? 'مسدد بالكامل' : inst.status === 'partially_paid' ? 'مسدد جزئياً' : inst.status === 'overdue' ? 'متأخر' : 'مستحق'}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          {hasPermission('installments', 'create') && inst.status !== 'paid' && (
                            <button
                              type="button"
                              onClick={() => openCollectForInstallment(inst)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                            >
                              تحصيل الآن
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RECEIPTS & PRINTING */}
      {activeTab === 'receipts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث برقم السند أو اسم العميل..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم السند</th>
                  <th className="p-3.5">تاريخ التحصيل</th>
                  <th className="p-3.5">اسم العميل</th>
                  <th className="p-3.5">البرج والوحدة</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">المبلغ المحصل</th>
                  <th className="p-3.5">الحساب المودع به</th>
                  <th className="p-3.5 text-center">طباعة الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد سندات قبض مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {rec.receipt_number}
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{rec.payment_date}</td>
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">{rec.client_name}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        {rec.tower_name} (وحدة {rec.unit_number})
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${
                          rec.payment_method === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rec.payment_method === 'bank_transfer'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {rec.payment_method === 'cash' ? 'نقدي' : rec.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                        </span>
                      </td>
                      <td className="p-3.5 font-black text-slate-900 whitespace-nowrap">
                        {Number(rec.amount_paid).toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {rec.bank_account_name || '-'}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        <button
                          type="button"
                          onClick={() => setReceiptToPrint(rec)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>عرض وطباعة</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHEQUES UNDER COLLECTION */}
      {activeTab === 'cheques' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-100 text-xs text-amber-900 font-medium">
            <span className="font-bold">حافظة الشيكات تحت التحصيل:</span> يتم هنا متابعة شيكات العملاء المحصلة كأقساط، وعند استحقاق موعد الصرف يتم الضغط على "تأكيد التحصيل البنكي" ليتم إيداع القيمة تلقائياً بالحساب البنكي وزيادة رصيده!
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم الشيك</th>
                  <th className="p-3.5">البنك المسحوب عليه</th>
                  <th className="p-3.5">تاريخ الاستحقاق</th>
                  <th className="p-3.5">العميل الساحب</th>
                  <th className="p-3.5">البرج والوحدة</th>
                  <th className="p-3.5">مبلغ الشيك (ج.م)</th>
                  <th className="p-3.5">حالة الشيك</th>
                  <th className="p-3.5 text-center">إجراء البنك</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {chequesUnderCollection.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد شيكات بنكية قيد التحصيل حالياً.
                    </td>
                  </tr>
                ) : (
                  chequesUnderCollection.map((chq) => (
                    <tr key={chq.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-black text-slate-900 whitespace-nowrap">
                        {chq.cheque_number}
                      </td>
                      <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                        {chq.cheque_bank_name || 'البنك المسحوب'}
                      </td>
                      <td className="p-3.5 font-bold text-amber-700 whitespace-nowrap">
                        {chq.cheque_due_date || '-'}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {chq.client_name}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {chq.tower_name} ({chq.unit_number})
                      </td>
                      <td className="p-3.5 font-black text-slate-900 whitespace-nowrap text-sm">
                        {Number(chq.amount_paid).toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                          تحت التحصيل
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        {hasPermission('installments', 'edit') && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetAcc = chq.bank_account_id || (bankAccounts[0]?.id || '');
                              handleClearCheque(chq.id, targetAcc);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>صرف وإيداع بالبنك</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <CollectPaymentModal
        isOpen={isCollectModalOpen}
        onClose={() => setIsCollectModalOpen(false)}
        onSubmit={handleCollectSubmit}
        installment={selectedInstallment}
        installmentsList={installments}
      />

      <ReceiptPrintModal
        isOpen={!!receiptToPrint}
        onClose={() => setReceiptToPrint(null)}
        receipt={receiptToPrint}
      />
    </div>
  );
};
