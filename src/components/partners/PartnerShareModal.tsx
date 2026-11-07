import React, { useState, useEffect } from 'react';
import { X, PieChart, Building2, DollarSign, Calculator, Percent, Landmark, CheckCircle2, User } from 'lucide-react';
import { Partner, Project, BankAccount } from '../../types';
import { dataService } from '../../lib/supabase';
import { financialService } from '../../lib/financialService';

interface PartnerShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  partners: Partner[];
  defaultPartnerId?: string;
  defaultProjectId?: string;
}

export const PartnerShareModal: React.FC<PartnerShareModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  partners,
  defaultPartnerId,
  defaultProjectId,
}) => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);

  const [formData, setFormData] = useState({
    partner_id: defaultPartnerId || '',
    project_id: defaultProjectId || '',
    investment_amount: '',
    project_total_budget: '',
    agreement_date: new Date().toISOString().split('T')[0],
    deposit_to_bank: true,
    bank_account_id: '',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      if (defaultPartnerId) setFormData((prev) => ({ ...prev, partner_id: defaultPartnerId }));
      if (defaultProjectId) handleProjectSelect(defaultProjectId);
    }
  }, [isOpen, defaultPartnerId, defaultProjectId]);

  const loadInitialData = async () => {
    try {
      const [projs, accounts] = await Promise.all([
        dataService.getProjects(),
        financialService.getBankAccounts(),
      ]);
      setProjects(projs);
      setBankAccounts(accounts.filter((a) => a.is_active));
      if (accounts.length > 0 && !formData.bank_account_id) {
        setFormData((prev) => ({ ...prev, bank_account_id: accounts[0].id }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleProjectSelect = (projId: string) => {
    const proj = projects.find((p) => p.id === projId);
    setFormData((prev) => ({
      ...prev,
      project_id: projId,
      project_total_budget: proj ? String(proj.estimated_budget || 0) : prev.project_total_budget,
    }));
  };

  if (!isOpen) return null;

  const investmentNum = Number(formData.investment_amount || 0);
  const totalBudgetNum = Number(formData.project_total_budget || 0);

  // Exact core formula required by user:
  // نسبة الشريك = (مبلغ مساهمة الشريك / المبلغ الإجمالي للمشروع) * 100
  const calculatedPercentage = totalBudgetNum > 0 && investmentNum > 0
    ? Number(((investmentNum / totalBudgetNum) * 100).toFixed(2))
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.partner_id || !formData.project_id || investmentNum <= 0 || totalBudgetNum <= 0) return;

    const partner = partners.find((p) => p.id === formData.partner_id);
    const project = projects.find((p) => p.id === formData.project_id);

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        partner_id: formData.partner_id,
        partner_name: partner?.name || '',
        project_name: project?.name || '',
        investment_amount: investmentNum,
        project_total_budget: totalBudgetNum,
        share_percentage: calculatedPercentage,
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
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">تسجيل مساهمة شريك في مشروع</h3>
              <p className="text-xs text-slate-400">
                احتساب نسبة الشراكة وحصة التكلفة والأرباح وفقاً للمبلغ المدخل وإجمالي المشروع
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-4">
            {/* Partner Selection from Coded Partners Directory */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                <User className="w-4 h-4 text-purple-400" />
                اسم الشريك (اختيار من قائمة تكويد الشركاء) <span className="text-rose-400">*</span>
              </label>

              <select
                required
                value={formData.partner_id}
                onChange={(e) => setFormData({ ...formData, partner_id: e.target.value })}
                className="w-full bg-slate-900 border-2 border-purple-500/70 rounded-xl px-3.5 py-3 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">-- اختر اسم الشريك من دليل الشركاء المكودين ({partners.length} شريك) --</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} [{p.code}] - ({p.partner_type_ar || p.partner_type}) - مساهماته السابقة: {p.total_invested.toLocaleString()} ج.م
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-purple-300/80 mt-1.5 block">
                * يتم اختيار الشريك مباشرة من قائمة الشركاء المكودين في النظام لربط الحصة وتوزيع الأرباح به.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                المشروع المراد الدخول فيه <span className="text-rose-400">*</span>
              </label>
              <select
                required
                value={formData.project_id}
                onChange={(e) => handleProjectSelect(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                <option value="">-- اختر المشروع العقاري --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (الميزانية التقديرية: {p.estimated_budget.toLocaleString()} ج.م)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-400" />
                  المبلغ الإجمالي للمشروع (ج.م) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={formData.project_total_budget}
                  onChange={(e) => setFormData({ ...formData, project_total_budget: e.target.value })}
                  placeholder="الميزانية الإجمالية للمشروع"
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  dir="ltr"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">رأس مال أو ميزانية المشروع التقديرية</span>
              </div>

              <div>
                <label className="block text-xs font-black text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  مبلغ المساهمة للشريك (ج.م) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={formData.investment_amount}
                  onChange={(e) => setFormData({ ...formData, investment_amount: e.target.value })}
                  placeholder="مبلغ مساهمة الشريك في المشروع"
                  className="w-full bg-slate-900 border-2 border-purple-500/60 rounded-xl px-3.5 py-2.5 text-base font-extrabold text-amber-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 shadow-inner"
                  dir="ltr"
                />
                <span className="text-[11px] text-purple-300 font-semibold mt-1 block">
                  ★ خانة تحديد مبلغ المساهمة التي تُحسب على أساسها نسبة التكلفة والأرباح
                </span>
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-purple-300 font-semibold flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-purple-400" />
                  نسبة الشريك المحتسبة في المشروع:
                </span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">
                  {calculatedPercentage}%
                </span>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span>معادلة الاحتساب الآلي:</span>
                <span className="font-mono text-amber-300" dir="ltr">
                  ({investmentNum.toLocaleString()} ÷ {totalBudgetNum.toLocaleString()}) × 100
                </span>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                يتحمل الشريك تلقائياً <strong className="text-white">{calculatedPercentage}%</strong> من التكاليف والمصروفات الفعلية للمشروع، ويستحق <strong className="text-white">{calculatedPercentage}%</strong> من مبيعات وعوائد وصافي أرباح المشروع.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  تاريخ الاتفاق / بدء الشراكة <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.agreement_date}
                  onChange={(e) => setFormData({ ...formData, agreement_date: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  إيداع المبلغ بحساب الشركة فوراً
                </label>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="deposit_to_bank"
                    checked={formData.deposit_to_bank}
                    onChange={(e) => setFormData({ ...formData, deposit_to_bank: e.target.checked })}
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-700 bg-slate-800"
                  />
                  <label htmlFor="deposit_to_bank" className="text-xs text-slate-300 select-none cursor-pointer">
                    إيداع كسيولة في حساب بنك / خزينة
                  </label>
                </div>
              </div>
            </div>

            {formData.deposit_to_bank && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  الحساب البنكي / الخزينة المودع فيها المبلغ
                </label>
                <select
                  required={formData.deposit_to_bank}
                  value={formData.bank_account_id}
                  onChange={(e) => setFormData({ ...formData, bank_account_id: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  <option value="">-- اختر الحساب البنكي --</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bank_name} - {acc.account_name} (الرصيد: {acc.balance.toLocaleString()} ج.م)
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                شروط أو ملاحظات عقد الشراكة
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="رقم عقد الشراكة، بنود توزيع العوائد، أو مواعيد التخارج..."
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
              disabled={loading || investmentNum <= 0 || totalBudgetNum <= 0}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل المساهمة بنسبة ' + calculatedPercentage + '%'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
