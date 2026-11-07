import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  PieChart, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  Phone, 
  CreditCard, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  FileSpreadsheet, 
  Printer, 
  Edit3, 
  Trash2, 
  Calculator,
  Percent,
  Landmark,
  Building2
} from 'lucide-react';
import { Partner, PartnerProjectShare, PartnerDistribution, PartnerFinancialCalculation } from '../../types';
import { financialService } from '../../lib/financialService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PartnerFormModal } from './PartnerFormModal';
import { PartnerShareModal } from './PartnerShareModal';
import { PartnerDistributionModal } from './PartnerDistributionModal';
import { PartnerStatementModal } from './PartnerStatementModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import * as XLSX from 'xlsx';

export const PartnersView: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'matrix' | 'partners' | 'shares' | 'distributions'>('matrix');

  // Data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [shares, setShares] = useState<PartnerProjectShare[]>([]);
  const [distributions, setDistributions] = useState<PartnerDistribution[]>([]);
  const [calculations, setCalculations] = useState<PartnerFinancialCalculation[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');

  // Modals
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [partnerToEdit, setPartnerToEdit] = useState<Partner | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [defaultSharePartnerId, setDefaultSharePartnerId] = useState<string | undefined>(undefined);

  const [isDistModalOpen, setIsDistModalOpen] = useState(false);
  const [defaultDistPartnerId, setDefaultDistPartnerId] = useState<string | undefined>(undefined);
  const [defaultDistProjectId, setDefaultDistProjectId] = useState<string | undefined>(undefined);
  const [suggestedDistAmount, setSuggestedDistAmount] = useState<number | undefined>(undefined);

  const [selectedStatementPartner, setSelectedStatementPartner] = useState<Partner | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pts, shs, dsts, calcs] = await Promise.all([
        financialService.getPartners(),
        financialService.getPartnerShares(),
        financialService.getPartnerDistributions(),
        financialService.getAllPartnersFinancialCalculations(),
      ]);
      setPartners(pts);
      setShares(shs);
      setDistributions(dsts);
      setCalculations(calcs);
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تحميل بيانات الشركاء');
    } finally {
      setLoading(false);
    }
  };

  // Partner CRUD
  const handleOpenAddPartner = () => {
    setPartnerToEdit(null);
    setIsPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (p: Partner) => {
    setPartnerToEdit(p);
    setIsPartnerModalOpen(true);
  };

  const handlePartnerSubmit = async (data: any) => {
    try {
      if (partnerToEdit) {
        await financialService.updatePartner(partnerToEdit.id, data, user);
        success(`تم تحديث بيانات الشريك "${data.name}" بنجاح`);
      } else {
        await financialService.createPartner(data, user);
        success(`تمت إضافة الشريك "${data.name}" بنجاح`);
      }
      loadData();
    } catch (err: any) {
      error(err.message || 'فشلت عملية حفظ الشريك');
      throw err;
    }
  };

  const handleDeletePartner = async (p: Partner) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف الشريك "${p.name}"؟`);
    if (!confirmDelete) return;

    try {
      await financialService.deletePartner(p.id, user);
      success(`تم حذف الشريك "${p.name}" بنجاح`);
      loadData();
    } catch (err: any) {
      error(err.message || 'تعذر حذف الشريك');
    }
  };

  // Share submit
  const handleShareSubmit = async (data: any) => {
    try {
      await financialService.createPartnerShare(data, user);
      success(`تم تسجيل مساهمة الشريك بنسبة ${data.share_percentage}% بنجاح`);
      loadData();
    } catch (err: any) {
      error(err.message || 'فشل تسجيل المساهمة');
      throw err;
    }
  };

  // Distribution submit
  const handleDistSubmit = async (data: any) => {
    try {
      await financialService.createPartnerDistribution(data, user);
      success(`تم تسجيل صرف أرباح بمبلغ ${Number(data.amount).toLocaleString()} ج.م للشريك بنجاح`);
      loadData();
    } catch (err: any) {
      error(err.message || 'فشل تسجيل صرف الأرباح');
      throw err;
    }
  };

  // Excel Export
  const handleExportPartnersExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Profit & Cost Sharing Matrix
    const matrixRows: (string | number)[][] = [
      ['مصفوفة احتساب التكاليف والأرباح للشركاء وفقاً لنسب المساهمة'],
      [`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`],
      [],
      [
        'اسم الشريك',
        'المشروع',
        'المبلغ المدخل من الشريك (ج.م)',
        'إجمالي مبلغ المشروع (ج.م)',
        'نسبة الشريك %',
        'تكلفة المشروع الفعلية (ج.م)',
        'نصيب الشريك من التكلفة (ج.م)',
        'إيرادات المشروع (ج.م)',
        'نصيب الشريك من الأرباح (ج.م)',
        'العائد على الاستثمار ROI%',
        'المسحوبات والتوزيعات (ج.م)',
        'صافي المستحق حالياً (ج.م)'
      ],
    ];

    calculations.forEach((c) => {
      matrixRows.push([
        c.partner_name,
        c.project_name,
        c.investment_amount,
        c.project_total_budget,
        `${c.share_percentage}%`,
        c.actual_project_cost,
        c.partner_cost_share,
        c.project_total_revenue,
        c.partner_profit_share,
        `${c.roi_percentage}%`,
        c.total_distributed,
        c.net_balance_due,
      ]);
    });

    const wsMatrix = XLSX.utils.aoa_to_sheet(matrixRows);
    wsMatrix['!cols'] = [
      { wch: 26 }, { wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 14 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 16 },
      { wch: 20 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(wb, wsMatrix, 'مصفوفة الأرباح والتكاليف');
    XLSX.writeFile(wb, `حسابات_الشركاء_والأرباح_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // KPIs
  const totalPartnerCapital = calculations.reduce((acc, c) => acc + c.investment_amount, 0);
  const totalPartnerProfit = calculations.reduce((acc, c) => acc + c.partner_profit_share, 0);
  const totalPartnerDistributions = distributions.reduce((acc, d) => acc + Number(d.amount || 0), 0);
  const totalNetDueToPartners = calculations.reduce((acc, c) => acc + c.net_balance_due, 0);

  // Unique projects list for filtering
  const projectOptions = Array.from(new Set(calculations.map((c) => JSON.stringify({ id: c.project_id, name: c.project_name })))).map(
    (str) => JSON.parse(str)
  );

  // Filter calculations
  const filteredCalculations = calculations.filter((c) => {
    const matchesSearch =
      c.partner_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.project_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProj = selectedProjectId === 'all' || c.project_id === selectedProjectId;
    return matchesSearch && matchesProj;
  });

  // Filter partners
  const filteredPartners = partners.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
    );
  });

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="جاري احتساب نسب الشركاء والتكاليف والأرباح..." />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">إدارة الشركاء ورؤوس الأموال والأرباح</h2>
            <p className="text-xs text-slate-400 mt-1">
              احتساب تلقائي للتكلفة والأرباح وفقاً للنسبة بين المبلغ الإجمالي للمشروع والمبالغ المدخلة من الشركاء
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPartnersExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل</span>
          </button>
          <button
            onClick={() => {
              setDefaultDistPartnerId(undefined);
              setDefaultDistProjectId(undefined);
              setSuggestedDistAmount(undefined);
              setIsDistModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-400 transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            <span>صرف أرباح / مسحوبات</span>
          </button>
          <button
            onClick={() => {
              setDefaultSharePartnerId(undefined);
              setIsShareModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-bold text-purple-400 transition-colors"
          >
            <PieChart className="w-4 h-4" />
            <span>تسجيل مساهمة في مشروع</span>
          </button>
          <button
            onClick={handleOpenAddPartner}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة شريك جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Partner Capital */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">إجمالي رؤوس أموال الشركاء</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Landmark className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-purple-400">
              {totalPartnerCapital.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">إجمالي المبالغ المدخلة من الشركاء في كافة المشروعات</p>
        </div>

        {/* Total Partner Profit Share */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">إجمالي نصيب الشركاء من الأرباح</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">
              {totalPartnerProfit.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">محسوبة وفقاً للنسبة % من صافي أرباح المشروعات</p>
        </div>

        {/* Total Distributions Paid */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">المسحوبات والتوزيعات المسددة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400">
              {totalPartnerDistributions.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">مبالغ تم تحويلها وصرفها للشركاء فعلياً</p>
        </div>

        {/* Net Due to Partners */}
        <div className="bg-slate-900 border border-purple-900/30 p-5 rounded-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 to-purple-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">صافي المستحق للشركاء حالياً</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-extrabold text-white">
              {totalNetDueToPartners.toLocaleString()}
            </span>
            <span className="text-xs text-purple-300/80 mr-1.5">ج.م</span>
          </div>
          <p className="text-[11px] text-purple-400/80 mt-2">معادلة: رأس المال + نصيب الأرباح - المسحوبات</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'matrix'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>مصفوفة احتساب التكاليف والأرباح بالحصة ({calculations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'partners'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>دليل الشركاء المستثمرين ({partners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('shares')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'shares'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>مساهمات وحصص المشروعات ({shares.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('distributions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'distributions'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>سجل صرف الأرباح والمسحوبات ({distributions.length})</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم الشريك أو اسم المشروع..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>

        {activeTab === 'matrix' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">تصفية بالمشروع:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">كافة المشروعات</option>
              {projectOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Dynamic Cost and Profit Allocation Matrix (The Core User Request) */}
      {activeTab === 'matrix' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 bg-purple-950/20 border-b border-purple-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <Calculator className="w-4 h-4 text-purple-400" />
              <span>
                المعادلة المعتمدة: <strong>نسبة الشريك % = (مبلغ الشريك ÷ المبلغ الإجمالي للمشروع) × 100</strong> • يتم تحميل الشريك بنفس النسبة من تكاليف المشروع وتوزيع الأرباح عليه وفقاً لها.
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-amber-400">
              عدد الشراكات المحسوبة: {filteredCalculations.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">الشريك</th>
                  <th className="p-3.5">المشروع</th>
                  <th className="p-3.5 text-center">مبلغ مساهمة الشريك</th>
                  <th className="p-3.5 text-center">المبلغ الإجمالي للمشروع</th>
                  <th className="p-3.5 text-center">نسبة الشريك %</th>
                  <th className="p-3.5 text-center">تكلفة المشروع</th>
                  <th className="p-3.5 text-center">نصيب الشريك من التكلفة</th>
                  <th className="p-3.5 text-center">مبيعات المشروع</th>
                  <th className="p-3.5 text-center">نصيب أرباح الشريك</th>
                  <th className="p-3.5 text-center">العائد ROI%</th>
                  <th className="p-3.5 text-center">المسحوبات</th>
                  <th className="p-3.5 text-left">صافي المستحق للشريك</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredCalculations.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-400">
                      لم يتم تسجيل أي مساهمات شراكة تطابق البحث.
                    </td>
                  </tr>
                ) : (
                  filteredCalculations.map((calc, idx) => {
                    const partnerObj = partners.find((p) => p.id === calc.partner_id);
                    return (
                      <tr key={`${calc.partner_id}-${calc.project_id}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-bold text-white whitespace-nowrap">
                          {calc.partner_name}
                        </td>
                        <td className="p-3.5 text-slate-300 font-semibold">
                          {calc.project_name}
                        </td>
                        <td className="p-3.5 text-center font-bold text-purple-400 whitespace-nowrap">
                          {calc.investment_amount.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-center text-slate-300 whitespace-nowrap">
                          {calc.project_total_budget.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono">
                            {calc.share_percentage}%
                          </span>
                        </td>
                        <td className="p-3.5 text-center text-slate-300 whitespace-nowrap">
                          {calc.actual_project_cost.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-center font-semibold text-amber-400 whitespace-nowrap">
                          {calc.partner_cost_share.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-center text-slate-300 whitespace-nowrap">
                          {calc.project_total_revenue.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-center font-bold text-emerald-400 whitespace-nowrap">
                          {calc.partner_profit_share.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-center font-bold text-purple-300 whitespace-nowrap font-mono">
                          {calc.roi_percentage}%
                        </td>
                        <td className="p-3.5 text-center text-rose-400 whitespace-nowrap">
                          {calc.total_distributed.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-left font-extrabold text-emerald-400 whitespace-nowrap">
                          {calc.net_balance_due.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setDefaultDistPartnerId(calc.partner_id);
                                setDefaultDistProjectId(calc.project_id);
                                setSuggestedDistAmount(Math.max(0, calc.partner_profit_share - calc.total_distributed));
                                setIsDistModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
                              title="صرف أرباح"
                            >
                              صرف أرباح
                            </button>
                            {partnerObj && (
                              <button
                                onClick={() => setSelectedStatementPartner(partnerObj)}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                title="تقرير الشريك التفصيلي"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
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

      {/* Tab 2: Partners Directory */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              لم يتم العثور على أي شركاء يطابقون خيارات البحث.
            </div>
          ) : (
            filteredPartners.map((p) => {
              const partnerCalcs = calculations.filter((c) => c.partner_id === p.id);
              const partnerTotalProfit = partnerCalcs.reduce((acc, c) => acc + c.partner_profit_share, 0);
              const partnerNetDue = partnerCalcs.reduce((acc, c) => acc + c.net_balance_due, 0);

              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-mono text-[11px] font-bold border border-purple-500/20 mb-1">
                          {p.code}
                        </span>
                        <h3 className="text-base font-bold text-white hover:text-purple-400 transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-xs text-purple-300/80 mt-0.5">{p.partner_type_ar || 'شريك استثماري'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {partnerCalcs.length} مشروعات
                      </span>
                    </div>

                    <div className="space-y-1.5 py-3 border-y border-slate-800/80 text-xs text-slate-400">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">رقم الهاتف:</span>
                        <a href={`tel:${p.phone}`} className="text-blue-400 font-mono hover:underline" dir="ltr">
                          {p.phone}
                        </a>
                      </div>
                      {p.national_id && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">الرقم القومي:</span>
                          <span className="font-mono text-slate-300">{p.national_id}</span>
                        </div>
                      )}
                      {p.bank_name && (
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">البنك للتحويلات:</span>
                          <span className="text-slate-300 truncate max-w-[180px]">{p.bank_name}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-4 text-center">
                      <div className="p-2 rounded-xl bg-slate-800/50">
                        <span className="text-[10px] text-slate-400 block mb-0.5">رأس المال</span>
                        <span className="text-xs font-bold text-purple-400">
                          {p.total_invested.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-800/50">
                        <span className="text-[10px] text-slate-400 block mb-0.5">الأرباح</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {partnerTotalProfit.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-950/20 border border-emerald-900/30">
                        <span className="text-[10px] text-emerald-300 block mb-0.5">المستحق</span>
                        <span className="text-xs font-bold text-emerald-400">
                          {partnerNetDue.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setSelectedStatementPartner(p)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-purple-400 transition-colors flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>كشف حساب</span>
                      </button>
                      <button
                        onClick={() => {
                          setDefaultSharePartnerId(p.id);
                          setIsShareModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-xs font-semibold text-purple-300 border border-purple-500/30 transition-colors flex items-center gap-1"
                      >
                        <PieChart className="w-3.5 h-3.5" />
                        <span>مساهمة جديدة</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditPartner(p)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="تعديل"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePartner(p)}
                        className="p-1.5 rounded-lg hover:bg-rose-900/40 text-slate-400 hover:text-rose-400"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 3: Project Shares and Agreements */}
      {activeTab === 'shares' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">الشريك</th>
                  <th className="p-3.5">المشروع</th>
                  <th className="p-3.5 text-center">مبلغ الشريك المدخل</th>
                  <th className="p-3.5 text-center">المبلغ الإجمالي للمشروع</th>
                  <th className="p-3.5 text-center">نسبة الشراكة المحتسبة</th>
                  <th className="p-3.5 text-center">تاريخ الاتفاق</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5">ملاحظات العقد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {shares.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لم يتم تسجيل أي حصص شراكة حتى الآن.
                    </td>
                  </tr>
                ) : (
                  shares.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-bold text-white whitespace-nowrap">{s.partner_name}</td>
                      <td className="p-3.5 font-semibold text-slate-200">{s.project_name}</td>
                      <td className="p-3.5 text-center font-bold text-purple-400 whitespace-nowrap">
                        {s.investment_amount.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 text-center text-slate-300 whitespace-nowrap">
                        {s.project_total_budget.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold font-mono">
                          {s.share_percentage}%
                        </span>
                      </td>
                      <td className="p-3.5 text-center text-slate-300 whitespace-nowrap">{s.agreement_date}</td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                          نشط وساري
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">{s.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Profit Distributions Ledger */}
      {activeTab === 'distributions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">رقم السند</th>
                  <th className="p-3.5">الشريك المستفيد</th>
                  <th className="p-3.5">المشروع</th>
                  <th className="p-3.5">تاريخ الصرف</th>
                  <th className="p-3.5">المبلغ المصروف</th>
                  <th className="p-3.5">نوع الدفعة</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">الحساب المسحوب منه</th>
                  <th className="p-3.5">المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {distributions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لم يتم تسجيل أي سندات صرف أرباح بعد.
                    </td>
                  </tr>
                ) : (
                  distributions.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {d.distribution_number}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">{d.partner_name}</td>
                      <td className="p-3.5 text-slate-300">{d.project_name || 'عام'}</td>
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">{d.distribution_date}</td>
                      <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">
                        {d.amount.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold">
                          {d.distribution_type === 'profit_payout'
                            ? 'أرباح دورية'
                            : d.distribution_type === 'withdrawal'
                            ? 'مسحوبات'
                            : 'استرداد رأس مال'}
                        </span>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="text-slate-300">
                          {d.payment_method === 'cash' ? 'نقدي' : d.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-[180px] truncate">{d.bank_account_name}</td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">{d.created_by_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <PartnerFormModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
        onSubmit={handlePartnerSubmit}
        partnerToEdit={partnerToEdit}
      />

      <PartnerShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={handleShareSubmit}
        partners={partners}
        defaultPartnerId={defaultSharePartnerId}
      />

      <PartnerDistributionModal
        isOpen={isDistModalOpen}
        onClose={() => setIsDistModalOpen(false)}
        onSubmit={handleDistSubmit}
        partners={partners}
        defaultPartnerId={defaultDistPartnerId}
        defaultProjectId={defaultDistProjectId}
        suggestedAmount={suggestedDistAmount}
      />

      {selectedStatementPartner && (
        <PartnerStatementModal
          isOpen={Boolean(selectedStatementPartner)}
          onClose={() => setSelectedStatementPartner(null)}
          partner={selectedStatementPartner}
        />
      )}
    </div>
  );
};
