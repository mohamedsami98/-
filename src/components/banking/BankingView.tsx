import React, { useState, useEffect, useMemo } from 'react';
import { 
  Landmark, 
  ArrowUpRight, 
  ArrowDownLeft, 
  DollarSign, 
  Search, 
  Plus, 
  Wallet, 
  Building2, 
  Receipt, 
  Clock,
  CreditCard
} from 'lucide-react';
import { BankAccount, BankTransaction } from '../../types';
import { financialService } from '../../lib/financialService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { BankAccountModal } from './BankAccountModal';

export const BankingView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<BankTransaction[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accs, txs] = await Promise.all([
        financialService.getBankAccounts(),
        financialService.getBankTransactions(),
      ]);
      setAccounts(accs);
      setTransactions(txs);
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تحميل بيانات الحسابات البنكية.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const txAccId = tx.bank_account_id || tx.account_id;
      const txAccName = tx.bank_account_name || tx.account_name;
      const matchAcc = selectedAccountId === 'all' || txAccId === selectedAccountId;
      const matchType = transactionTypeFilter === 'all' || tx.transaction_type === transactionTypeFilter;
      const matchSearch = searchTerm === '' ||
        tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txAccName.toLowerCase().includes(searchTerm.toLowerCase());
      return matchAcc && matchType && matchSearch;
    });
  }, [transactions, selectedAccountId, transactionTypeFilter, searchTerm]);

  // Aggregate totals
  const totalLiquidity = useMemo(() => {
    return accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  }, [accounts]);

  const totalDeposits = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'deposit')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalWithdrawals = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === 'withdrawal')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const handleAddAccount = async (accountData: any) => {
    if (!user) return;
    try {
      await financialService.addBankAccount(accountData, user);
      success('تمت إضافة الحساب البنكي / الخزينة بنجاح.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشلت إضافة الحساب البنكي.');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Account Filter */}
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-500" />
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">كافة الحسابات البنكية والخزائن</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.bank_name} - {a.account_name} ({a.balance.toLocaleString()} ج.م)
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <select
            value={transactionTypeFilter}
            onChange={(e) => setTransactionTypeFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
          >
            <option value="all">كافة الحركات (إيداع وصرف)</option>
            <option value="deposit">تحصيلات وإيداعات فقط (+)</option>
            <option value="withdrawal">مصروفات ومسحوبات فقط (-)</option>
          </select>
        </div>

        {/* Add Account Button */}
        {hasPermission('banking', 'create') && (
          <button
            type="button"
            id="add-bank-account-btn"
            onClick={() => setIsAccountModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة حساب بنكي / خزينة</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي السيولة البنكية والنقدية</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {totalLiquidity.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            موزعة على {accounts.length} حسابات وخزائن
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المقبوضات والتحصيلات</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-blue-600">
            +{totalDeposits.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            تحصيلات أقساط وإيداعات
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المصروفات والمدفوعات</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600">
            -{totalWithdrawals.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            نفقات إنشائية ومستخلصات مقاولين
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">صافي التدفق النقدي التشغيلي</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`mt-3 text-2xl font-black ${totalDeposits >= totalWithdrawals ? 'text-emerald-600' : 'text-rose-600'}`}>
            {(totalDeposits - totalWithdrawals).toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            الفارق بين التحصيلات والإنفاق
          </div>
        </div>
      </div>

      {/* Bank Accounts Grid Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Landmark className="w-4 h-4 text-blue-600" />
          <span>أرصدة الحسابات البنكية والخزائن المعتمدة</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className={`p-5 rounded-2xl border transition-all ${
                selectedAccountId === acc.id
                  ? 'bg-blue-50/50 border-blue-400 shadow-md'
                  : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                    acc.account_type === 'cashbox'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {acc.account_type === 'cashbox' ? 'خزينة نقدية' : 'حساب بنكي'}
                  </span>
                  <h4 className="mt-2 text-sm font-bold text-slate-900">{acc.bank_name}</h4>
                  <p className="text-xs text-slate-500">{acc.account_name}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                  <Landmark className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                <span className="text-xs text-slate-500">الرصيد الفعلي:</span>
                <span className="text-lg font-black text-slate-900">
                  {acc.balance.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
                </span>
              </div>

              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                <span>رقم الحساب: {acc.account_number}</span>
                {acc.branch && <span>{acc.branch}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transactions Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="البحث في بيان الحركة أو الحساب..."
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
          <div className="text-xs text-slate-500">
            عدد الحركات: <span className="font-bold text-slate-800">{filteredTransactions.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3.5">نوع الحركة</th>
                <th className="p-3.5">التاريخ</th>
                <th className="p-3.5">الحساب البنكي / الخزينة</th>
                <th className="p-3.5">بيان المعاملة</th>
                <th className="p-3.5">قيمة الحركة (ج.م)</th>
                <th className="p-3.5">الرصيد بعد الحركة</th>
                <th className="p-3.5">المرجع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    لا توجد حركات بنكية مسجلة مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                        tx.transaction_type === 'deposit'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {tx.transaction_type === 'deposit' ? (
                          <>
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                            <span>إيداع / تحصيل (+)</span>
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>صرف / نفقة (-)</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">{tx.transaction_date}</td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {tx.bank_account_name || tx.account_name}
                    </td>
                    <td className="p-3.5 max-w-md font-semibold text-slate-800">
                      {tx.description}
                    </td>
                    <td className={`p-3.5 font-black whitespace-nowrap text-sm ${
                      tx.transaction_type === 'deposit' ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {tx.transaction_type === 'deposit' ? '+' : '-'}{Number(tx.amount).toLocaleString()} ج.م
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                      {Number(tx.balance_after).toLocaleString()} ج.م
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap text-[11px]">
                      {tx.category === 'expense_payout' || tx.reference_type === 'expense' ? 'مصروف برج' : (tx.category === 'installment_payment' || tx.reference_type === 'installment_receipt') ? 'سند قسط' : 'تسوية'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Account Modal */}
      <BankAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSubmit={handleAddAccount}
      />
    </div>
  );
};
