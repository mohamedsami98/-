import React, { useState, useEffect } from 'react';
import { X, Receipt, Building2, Building, DollarSign, Calendar, FileText, UserCheck, CreditCard, Users2 } from 'lucide-react';
import { Project, Tower, CostCategory, BankAccount, Supplier } from '../../types';
import { dataService } from '../../lib/supabase';
import { financialService } from '../../lib/financialService';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  defaultTowerId?: string;
  defaultProjectId?: string;
}

const CATEGORY_OPTIONS: { key: CostCategory; label: string; desc: string }[] = [
  { key: 'building_materials', label: 'مواد بناء وتوريدات خرسانية', desc: 'حديد، أسمنت، خرسانة جاهزة، رمل وسن وطوب' },
  { key: 'labor_subcontractors', label: 'أجور ومصنعيات ومقاولين باطن', desc: 'مستخلصات نجارة وحدادة ومصنعيات بناء ومحارة' },
  { key: 'machinery_equipment', label: 'إيجار وتشغيل معدات وآليات', desc: 'أوناش أبراج، خلاطات، حفارات، ومضخات خرسانة' },
  { key: 'engineering_supervision', label: 'إشراف هندسي واستشارات', desc: 'أتعاب المكاتب الاستشارية، التصميمات، واختبارات التربة' },
  { key: 'permits_fees', label: 'تراخيص ورسوم وتأمينات', desc: 'تصاريح الحفر والبناء، رسوم الجهاز، والتأمينات الاجتماعية' },
  { key: 'site_administrative', label: 'مصاريف موقع وإدارية', desc: 'كرفانات، حراسة، كهرباء ومياه مؤقتة، نثريات' },
  { key: 'other', label: 'مصروفات أخرى متنوعة', desc: 'أي بنود إضافية لا تندرج تحت البنود السابقة' },
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultTowerId,
  defaultProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredTowers, setFilteredTowers] = useState<Tower[]>([]);

  const [projectId, setProjectId] = useState<string>('');
  const [towerId, setTowerId] = useState<string>('');
  const [category, setCategory] = useState<CostCategory>('building_materials');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierBeneficiary, setSupplierBeneficiary] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'cheque'>('bank_transfer');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const loadDependencies = async () => {
      try {
        const [projs, tows, accounts, sups] = await Promise.all([
          dataService.getProjects(),
          dataService.getTowers(),
          financialService.getBankAccounts(),
          financialService.getSuppliers(),
        ]);
        setProjects(projs);
        setTowers(tows);
        setBankAccounts(accounts);
        setSuppliers(sups);

        const initProjId = defaultProjectId || (projs.length > 0 ? projs[0].id : '');
        setProjectId(initProjId);

        const related = tows.filter((t) => t.project_id === initProjId);
        setFilteredTowers(related);
        setTowerId(defaultTowerId || (related.length > 0 ? related[0].id : ''));
        if (accounts.length > 0) {
          setBankAccountId(accounts[0].id);
        }
      } catch (err) {
        console.error('Failed to load dependencies', err);
      }
    };
    loadDependencies();
  }, [isOpen, defaultProjectId, defaultTowerId]);

  const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setProjectId(pId);
    const related = towers.filter((t) => t.project_id === pId);
    setFilteredTowers(related);
    setTowerId(related.length > 0 ? related[0].id : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!projectId || !towerId) {
      setErrorMsg('يرجى اختيار المشروع والبرج التابع له.');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح أكبر من الصفر.');
      return;
    }
    if (!supplierBeneficiary.trim()) {
      setErrorMsg('يرجى إدخال اسم المورد أو المستفيد.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('يرجى إدخال بيان المصروف.');
      return;
    }

    const selectedProj = projects.find((p) => p.id === projectId);
    const selectedTower = towers.find((t) => t.id === towerId);
    const selectedAcc = bankAccounts.find((a) => a.id === bankAccountId);
    const selectedCat = CATEGORY_OPTIONS.find((c) => c.key === category);

    setLoading(true);
    try {
      await onSubmit({
        project_id: projectId,
        project_name: selectedProj?.name,
        tower_id: towerId,
        tower_name: selectedTower?.name,
        category,
        category_ar: selectedCat?.label,
        amount: parsedAmount,
        expense_date: expenseDate,
        invoice_number: invoiceNumber.trim() || undefined,
        supplier_beneficiary: supplierBeneficiary.trim(),
        payment_method: paymentMethod,
        bank_account_id: bankAccountId || undefined,
        bank_account_name: selectedAcc ? `${selectedAcc.bank_name} (${selectedAcc.account_name})` : undefined,
        description: description.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء حفظ المصروف.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">قيد مصروف جديد على البرج</h3>
              <p className="text-xs text-slate-300">تسجيل تكلفة مباشرة ومصروفات إنشائية على الأبراج</p>
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
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project & Tower Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                المشروع الإنشائي *
              </label>
              <select
                value={projectId}
                onChange={handleProjectChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                البرج المستهدف *
              </label>
              <select
                value={towerId}
                onChange={(e) => setTowerId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {filteredTowers.length === 0 ? (
                  <option value="">لا توجد أبراج مسجلة بهذا المشروع</option>
                ) : (
                  filteredTowers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.floors_count} دور)</option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                بند وتصنيف التكلفة *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CostCategory)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat.key} value={cat.key}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                المبلغ الإجمالي (بالجنيه المصري) *
              </label>
              <input
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="مثال: 450000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Supplier & Invoice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  المورد / المستفيد / مقاول الباطن *
                </label>
                {suppliers.length > 0 && (
                  <span className="text-[10px] text-blue-600">اختر من القائمة أو اكتب اسماً</span>
                )}
              </div>

              {suppliers.length > 0 && (
                <div className="mb-2">
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      const supId = e.target.value;
                      setSelectedSupplierId(supId);
                      const sup = suppliers.find((s) => s.id === supId);
                      if (sup) {
                        setSupplierBeneficiary(sup.name);
                      }
                    }}
                    className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 text-indigo-950 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none mb-1.5"
                  >
                    <option value="">-- اختيار سريع من دليل الموردين المسجلين --</option>
                    {suppliers.map((sup) => (
                      <option key={sup.id} value={sup.id}>
                        {sup.name} ({sup.category_ar || sup.category}) - رصيد: {sup.current_balance.toLocaleString()} ج.م
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                value={supplierBeneficiary}
                onChange={(e) => {
                  setSupplierBeneficiary(e.target.value);
                  setSelectedSupplierId('');
                }}
                required
                placeholder="اسم المورد أو المستفيد الفعلي"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                رقم الفاتورة / المستخلص
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="مثال: INV-2025-098"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Linked Bank/Cashbox Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-purple-600" />
                طريقة الدفع والصرف *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="bank_transfer">تحويل بنكي مباشر</option>
                <option value="cheque">شيك بنكي مؤجل / حال</option>
                <option value="cash">نقداً من الخزينة</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                الحساب البنكي / الخزينة المخصومة *
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.bank_name} - {acc.account_name} (رصيد: {acc.balance.toLocaleString()} ج.م)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Description */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                تاريخ المصروف *
              </label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                بيان المصروف التفصيلي *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="مثال: توريد وصب خرسانة جاهزة لسقف الدور السابع"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              ملاحظات إضافية أو توصيات الاستشاري
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تم اعتماد شهادات الكسر بعد 28 يوماً بنجاح"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'قيد المصروف الآن'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
