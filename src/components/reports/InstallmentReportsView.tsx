import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FileBarChart, 
  Search, 
  Filter, 
  Calendar, 
  Building2, 
  Building, 
  CreditCard, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  Phone, 
  Download, 
  Printer, 
  RotateCcw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ExternalLink, 
  Sparkles, 
  TrendingUp, 
  ChevronDown,
  X,
  User,
  Layers,
  FileSpreadsheet,
  AlertTriangle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ContractInstallment, Project, Tower } from '../../types';
import { financialService } from '../../lib/financialService';
import { dataService } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CollectPaymentModal } from '../installments/CollectPaymentModal';
import { ReceiptPrintModal } from '../installments/ReceiptPrintModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';

type ScopeTab = 'all' | 'overdue' | 'upcoming' | 'paid';
type DatePreset = 'all' | 'overdue' | 'next_7' | 'next_30' | 'this_month' | 'this_quarter' | 'next_quarter' | 'this_year' | 'custom';
type OverdueSeverity = 'all' | 'gt_90' | '60_90' | '30_60' | 'lt_30';
type SortField = 'due_date' | 'amount' | 'client_name' | 'project_name' | 'overdue_days';
type SortDirection = 'asc' | 'desc';

interface InstallmentReportsViewProps {
  onNavigate?: (view: string) => void;
}

export const InstallmentReportsView: React.FC<InstallmentReportsViewProps> = ({ onNavigate }) => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  // Data states
  const [installments, setInstallments] = useState<ContractInstallment[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [scopeTab, setScopeTab] = useState<ScopeTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedTowerId, setSelectedTowerId] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [overdueSeverity, setOverdueSeverity] = useState<OverdueSeverity>('all');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Modals
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [selectedInstallmentForCollect, setSelectedInstallmentForCollect] = useState<ContractInstallment | null>(null);
  const [receiptToPrint, setReceiptToPrint] = useState<any>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Load Initial Data
  const loadData = async () => {
    setLoading(true);
    try {
      const [instData, projData, towData] = await Promise.all([
        financialService.getContractInstallments(),
        dataService.getProjects(),
        dataService.getTowers(),
      ]);
      setInstallments(instData);
      setProjects(projData);
      setTowers(towData);
    } catch (err: any) {
      console.error('Failed to load installment reports data', err);
      error('تعذر جلب بيانات الأقساط والتقارير.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter towers based on selected project
  const availableTowers = useMemo(() => {
    if (selectedProjectId === 'all') return towers;
    return towers.filter(t => t.project_id === selectedProjectId);
  }, [towers, selectedProjectId]);

  // Today reference date normalized to midnight
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Helper to calculate days difference relative to today
  const calculateDaysInfo = (dueDateStr: string, status: string) => {
    const dueDate = new Date(dueDateStr);
    dueDate.setHours(0, 0, 0, 0);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const isPastDue = diffDays < 0 || status === 'overdue';
    const overdueDays = diffDays < 0 ? Math.abs(diffDays) : (status === 'overdue' ? 1 : 0);
    const daysRemaining = diffDays > 0 ? diffDays : 0;

    return {
      diffDays,
      isPastDue,
      overdueDays,
      daysRemaining,
      isToday: diffDays === 0,
    };
  };

  // Helper for date presets
  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const now = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (preset === 'overdue') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      setStartDate('');
      setEndDate(formatDate(yesterday));
    } else if (preset === 'next_7') {
      const in7Days = new Date(now);
      in7Days.setDate(in7Days.getDate() + 7);
      setStartDate(formatDate(now));
      setEndDate(formatDate(in7Days));
    } else if (preset === 'next_30') {
      const in30Days = new Date(now);
      in30Days.setDate(in30Days.getDate() + 30);
      setStartDate(formatDate(now));
      setEndDate(formatDate(in30Days));
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(formatDate(startOfMonth));
      setEndDate(formatDate(endOfMonth));
    } else if (preset === 'this_quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0);
      setStartDate(formatDate(startOfQuarter));
      setEndDate(formatDate(endOfQuarter));
    } else if (preset === 'next_quarter') {
      const nextQuarter = Math.floor(now.getMonth() / 3) + 1;
      const startOfNextQuarter = new Date(now.getFullYear(), nextQuarter * 3, 1);
      const endOfNextQuarter = new Date(now.getFullYear(), (nextQuarter + 1) * 3, 0);
      setStartDate(formatDate(startOfNextQuarter));
      setEndDate(formatDate(endOfNextQuarter));
    } else if (preset === 'this_year') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      setStartDate(formatDate(startOfYear));
      setEndDate(formatDate(endOfYear));
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setScopeTab('all');
    setSearchQuery('');
    setSelectedProjectId('all');
    setSelectedTowerId('all');
    setDatePreset('all');
    setStartDate('');
    setEndDate('');
    setOverdueSeverity('all');
    setSortField('due_date');
    setSortDirection('asc');
  };

  // Filter & Sort Logic
  const filteredInstallments = useMemo(() => {
    return installments.filter((item) => {
      const daysInfo = calculateDaysInfo(item.due_date, item.status);

      // Scope Tab filter
      if (scopeTab === 'overdue') {
        if (item.status === 'paid' || (!daysInfo.isPastDue && item.status !== 'overdue')) {
          return false;
        }
      } else if (scopeTab === 'upcoming') {
        if (item.status === 'paid' || daysInfo.isPastDue || item.status === 'overdue') {
          return false;
        }
      } else if (scopeTab === 'paid') {
        if (item.status !== 'paid') {
          return false;
        }
      }

      // Project filter
      if (selectedProjectId !== 'all' && item.project_id !== selectedProjectId) {
        return false;
      }

      // Tower filter
      if (selectedTowerId !== 'all' && item.tower_id !== selectedTowerId) {
        return false;
      }

      // Overdue severity filter
      if (overdueSeverity !== 'all') {
        if (item.status === 'paid') return false;
        const days = daysInfo.overdueDays;
        if (overdueSeverity === 'gt_90' && days < 90) return false;
        if (overdueSeverity === '60_90' && (days < 60 || days >= 90)) return false;
        if (overdueSeverity === '30_60' && (days < 30 || days >= 60)) return false;
        if (overdueSeverity === 'lt_30' && (days <= 0 || days >= 30)) return false;
      }

      // Date range filter
      if (startDate) {
        if (item.due_date < startDate) return false;
      }
      if (endDate) {
        if (item.due_date > endDate) return false;
      }

      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const clientMatch = item.client_name?.toLowerCase().includes(query);
        const phoneMatch = item.client_phone?.toLowerCase().includes(query);
        const contractMatch = item.contract_number?.toLowerCase().includes(query);
        const unitMatch = item.unit_number?.toLowerCase().includes(query);
        const projectMatch = item.project_name?.toLowerCase().includes(query);
        const towerMatch = item.tower_name?.toLowerCase().includes(query);
        const titleMatch = item.installment_title?.toLowerCase().includes(query);

        if (!clientMatch && !phoneMatch && !contractMatch && !unitMatch && !projectMatch && !towerMatch && !titleMatch) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      const daysInfoA = calculateDaysInfo(a.due_date, a.status);
      const daysInfoB = calculateDaysInfo(b.due_date, b.status);

      if (sortField === 'due_date') {
        comparison = a.due_date.localeCompare(b.due_date);
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortField === 'client_name') {
        comparison = a.client_name.localeCompare(b.client_name, 'ar');
      } else if (sortField === 'project_name') {
        comparison = a.project_name.localeCompare(b.project_name, 'ar');
      } else if (sortField === 'overdue_days') {
        comparison = daysInfoA.overdueDays - daysInfoB.overdueDays;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [
    installments, 
    scopeTab, 
    selectedProjectId, 
    selectedTowerId, 
    overdueSeverity, 
    startDate, 
    endDate, 
    searchQuery, 
    sortField, 
    sortDirection
  ]);

  // Overall statistics (unfiltered or global)
  const stats = useMemo(() => {
    let totalOverdueAmount = 0;
    let totalOverdueCount = 0;
    let criticalOverdueCount = 0; // > 60 days

    let totalUpcomingAmount = 0;
    let totalUpcomingCount = 0;
    let upcomingNext30DaysAmount = 0;

    let thisMonthDueAmount = 0;
    let thisMonthDueCount = 0;

    let totalPaidAmount = 0;
    let totalPaidCount = 0;

    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    installments.forEach(item => {
      const daysInfo = calculateDaysInfo(item.due_date, item.status);

      if (item.status === 'paid') {
        totalPaidAmount += item.amount;
        totalPaidCount++;
      } else if (daysInfo.isPastDue || item.status === 'overdue') {
        totalOverdueAmount += item.amount;
        totalOverdueCount++;
        if (daysInfo.overdueDays >= 60) {
          criticalOverdueCount++;
        }
      } else {
        totalUpcomingAmount += item.amount;
        totalUpcomingCount++;
        if (daysInfo.daysRemaining <= 30) {
          upcomingNext30DaysAmount += item.amount;
        }
      }

      if (item.due_date.startsWith(currentYearMonth)) {
        thisMonthDueAmount += item.amount;
        thisMonthDueCount++;
      }
    });

    const totalPortfolio = totalOverdueAmount + totalUpcomingAmount + totalPaidAmount;
    const collectionEfficiency = totalPortfolio > 0 
      ? Math.round((totalPaidAmount / totalPortfolio) * 100) 
      : 0;

    return {
      totalOverdueAmount,
      totalOverdueCount,
      criticalOverdueCount,
      totalUpcomingAmount,
      totalUpcomingCount,
      upcomingNext30DaysAmount,
      thisMonthDueAmount,
      thisMonthDueCount,
      totalPaidAmount,
      totalPaidCount,
      collectionEfficiency,
    };
  }, [installments, today]);

  // Filtered table summary totals
  const filteredTotals = useMemo(() => {
    let sumAmount = 0;
    let overdueSum = 0;
    let upcomingSum = 0;
    let paidSum = 0;

    filteredInstallments.forEach(i => {
      sumAmount += i.amount;
      const daysInfo = calculateDaysInfo(i.due_date, i.status);
      if (i.status === 'paid') {
        paidSum += i.amount;
      } else if (daysInfo.isPastDue || i.status === 'overdue') {
        overdueSum += i.amount;
      } else {
        upcomingSum += i.amount;
      }
    });

    return {
      count: filteredInstallments.length,
      sumAmount,
      overdueSum,
      upcomingSum,
      paidSum,
    };
  }, [filteredInstallments, today]);

  // Group upcoming collections by month for projection preview
  const upcomingMonthlyProjection = useMemo(() => {
    const map: Record<string, { label: string; amount: number; count: number }> = {};
    installments
      .filter(i => i.status !== 'paid' && !calculateDaysInfo(i.due_date, i.status).isPastDue)
      .forEach(i => {
        const key = i.due_date.substring(0, 7); // YYYY-MM
        if (!map[key]) {
          const dateObj = new Date(`${key}-01`);
          const monthName = dateObj.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
          map[key] = { label: monthName, amount: 0, count: 0 };
        }
        map[key].amount += i.amount;
        map[key].count += 1;
      });

    return Object.keys(map)
      .sort()
      .slice(0, 5)
      .map(k => ({ key: k, ...map[k] }));
  }, [installments, today]);

  // Group overdue by project for risk distribution
  const overdueByProject = useMemo(() => {
    const map: Record<string, { projectName: string; amount: number; count: number }> = {};
    installments
      .filter(i => i.status !== 'paid' && calculateDaysInfo(i.due_date, i.status).isPastDue)
      .forEach(i => {
        if (!map[i.project_id]) {
          map[i.project_id] = { projectName: i.project_name, amount: 0, count: 0 };
        }
        map[i.project_id].amount += i.amount;
        map[i.project_id].count += 1;
      });

    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [installments, today]);

  // Handle Sort Change
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Open Collect Modal
  const handleOpenCollect = (inst: ContractInstallment) => {
    setSelectedInstallmentForCollect(inst);
    setCollectModalOpen(true);
  };

  // Submit Collect Payment
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

  // Export to Excel with custom formatting and Arabic headers
  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      const rows = filteredInstallments.map((item, idx) => {
        const daysInfo = calculateDaysInfo(item.due_date, item.status);
        let statusAr = 'قيد الانتظار';
        if (item.status === 'paid') statusAr = 'مسدد بالكامل';
        else if (daysInfo.isPastDue || item.status === 'overdue') statusAr = `متأخر (${daysInfo.overdueDays} يوم)`;
        else statusAr = `يستحق بعد (${daysInfo.daysRemaining} يوم)`;

        return {
          'م': idx + 1,
          'رقم العقد': item.contract_number,
          'اسم العميل': item.client_name,
          'رقم هاتف العميل': item.client_phone || 'غير مسجل',
          'المشروع': item.project_name,
          'البرج / المبنى': item.tower_name,
          'رقم الوحدة': item.unit_number,
          'نوع الوحدة': item.unit_type === 'apartment' ? 'شقة سكنية' : item.unit_type === 'duplex' ? 'دوبلكس' : item.unit_type === 'clinic' ? 'عيادة طبية' : item.unit_type === 'commercial_shop' ? 'محل تجاري' : 'وحدة عقارية',
          'مساحة الوحدة (م²)': item.unit_area_sqm,
          'إجمالي سعر الوحدة (ج.م)': item.total_unit_price,
          'عنوان القسط': item.installment_title,
          'رقم الدفعة': `${item.installment_number} من ${item.total_installments_count}`,
          'تاريخ الاستحقاق': item.due_date,
          'قيمة القسط (ج.م)': item.amount,
          'الحالة': statusAr,
          'أيام التأخير': daysInfo.overdueDays > 0 ? daysInfo.overdueDays : 0,
          'أيام متبقية': daysInfo.daysRemaining > 0 ? daysInfo.daysRemaining : 0,
          'إجمالي المسدد من الوحدة (ج.م)': item.paid_amount || 0,
          'المتبقي من سعر الوحدة (ج.م)': item.remaining_amount || 0,
          'تاريخ السداد الفعلي': item.payment_date || '-',
          'طريقة السداد': item.payment_method === 'cash' ? 'نقدي' : item.payment_method === 'bank_transfer' ? 'تحويل بنكي' : item.payment_method === 'cheque' ? 'شيك بنكي' : '-'
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      worksheet['!dir'] = 'rtl';

      // Auto fit columns
      worksheet['!cols'] = [
        { wch: 6 },
        { wch: 15 },
        { wch: 25 },
        { wch: 16 },
        { wch: 28 },
        { wch: 22 },
        { wch: 12 },
        { wch: 16 },
        { wch: 16 },
        { wch: 22 },
        { wch: 26 },
        { wch: 14 },
        { wch: 15 },
        { wch: 18 },
        { wch: 20 },
        { wch: 14 },
        { wch: 14 },
        { wch: 22 },
        { wch: 22 },
        { wch: 18 },
        { wch: 15 },
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير الأقساط والتحصيل');

      const fileName = `تقرير_متابعة_الأقساط_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      success('تم تصدير تقرير الأقساط والتحصيل بنجاح إلى ملف إكسيل (.xlsx).');
    } catch (err: any) {
      console.error('Failed to export excel', err);
      error('تعذر تصدير تقرير الإكسيل.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const renderSortIndicator = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 inline mr-1" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 inline mr-1" />
    );
  };

  if (loading) {
    return <LoadingSpinner message="جاري تجهيز تقارير الأقساط المتأخرة والتحصيلات القادمة..." />;
  }

  return (
    <div className="space-y-6 pb-16" dir="rtl">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
            <FileBarChart className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              تقارير متابعة الأقساط المتأخرة والتحصيلات القادمة
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed">
              رقابة مالية تفصيلية على جداول استحقاق الأقساط العقارية، تتبع العملاء المتأخرين حسب مدة التأخير، وجدولة التدفقات النقدية المتوقعة لكل مشروع.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="إعادة تحميل أحدث البيانات من النظام"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
            title="طباعة نسخة رسمية مجهزة من التقرير"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>طباعة التقرير</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel || filteredInstallments.length === 0}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
            title="تصدير جدول البيانات الحالي إلى ملف Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isExportingExcel ? 'جاري التصدير...' : 'تصدير إكسيل (.xlsx)'}</span>
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overdue Total */}
        <div 
          onClick={() => setScopeTab('overdue')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all duration-200 ${
            scopeTab === 'overdue' 
              ? 'bg-rose-50/90 border-rose-300 shadow-md ring-2 ring-rose-400/30' 
              : 'bg-white border-slate-200/80 hover:border-rose-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{stats.totalOverdueCount} قسط متعثر</span>
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-slate-500">إجمالي الأقساط المتأخرة</span>
            <div className="text-2xl font-black text-rose-950 mt-0.5">
              {stats.totalOverdueAmount.toLocaleString()} <span className="text-xs font-normal text-rose-700">ج.م</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-rose-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>تأخير حرج (&gt; 60 يوم):</span>
            <span className="font-bold text-rose-700">{stats.criticalOverdueCount} أقساط</span>
          </div>
        </div>

        {/* Upcoming Collections */}
        <div 
          onClick={() => setScopeTab('upcoming')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all duration-200 ${
            scopeTab === 'upcoming' 
              ? 'bg-blue-50/90 border-blue-300 shadow-md ring-2 ring-blue-400/30' 
              : 'bg-white border-slate-200/80 hover:border-blue-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>{stats.totalUpcomingCount} استحقاق قادم</span>
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-slate-500">التحصيلات القادمة المتوقعة</span>
            <div className="text-2xl font-black text-blue-950 mt-0.5">
              {stats.totalUpcomingAmount.toLocaleString()} <span className="text-xs font-normal text-blue-700">ج.م</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-blue-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>خلال 30 يوم القادمة:</span>
            <span className="font-bold text-blue-800">{stats.upcomingNext30DaysAmount.toLocaleString()} ج.م</span>
          </div>
        </div>

        {/* Due This Month */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
              استحقاقات هذا الشهر
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-slate-500">مطلوب تحصيله في الشهر الجاري</span>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {stats.thisMonthDueAmount.toLocaleString()} <span className="text-xs font-normal text-slate-500">ج.م</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>عدد الأقساط المستحقة:</span>
            <span className="font-bold text-indigo-700">{stats.thisMonthDueCount} قسط</span>
          </div>
        </div>

        {/* Collected Total */}
        <div 
          onClick={() => setScopeTab('paid')}
          className={`cursor-pointer p-5 rounded-3xl border transition-all duration-200 ${
            scopeTab === 'paid' 
              ? 'bg-emerald-50/90 border-emerald-300 shadow-md ring-2 ring-emerald-400/30' 
              : 'bg-white border-slate-200/80 hover:border-emerald-200 hover:shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.totalPaidCount} مسدد</span>
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-xs font-medium text-slate-500">إجمالي المبالغ المسددة</span>
            <div className="text-2xl font-black text-emerald-950 mt-0.5">
              {stats.totalPaidAmount.toLocaleString()} <span className="text-xs font-normal text-emerald-700">ج.م</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2.5 border-t border-emerald-100/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>كفاءة التحصيل الإجمالية:</span>
            <span className="font-bold text-emerald-700">{stats.collectionEfficiency}%</span>
          </div>
        </div>
      </div>

      {/* 3. Projection & Risk Distribution Quick Bar (Collapsible/Insightful) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upcoming Collections Projection */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">جدول التدفقات النقدية المتوقعة للأشهر القادمة</h3>
            </div>
            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">الأقساط غير المسددة</span>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingMonthlyProjection.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">لا توجد أقساط قادمة مسجلة في الفترات المقبلة.</p>
            ) : (
              upcomingMonthlyProjection.map((m) => {
                const percent = stats.totalUpcomingAmount > 0 ? (m.amount / stats.totalUpcomingAmount) * 100 : 0;
                return (
                  <div key={m.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{m.label} ({m.count} قسط)</span>
                      <span className="font-bold text-blue-700">{m.amount.toLocaleString()} ج.م</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-l from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(8, percent))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Overdue Delinquency By Project */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">تركز الأقساط المتأخرة حسب المشروعات</h3>
            </div>
            <span className="text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">تحليل المخاطر</span>
          </div>
          <div className="mt-4 space-y-3">
            {overdueByProject.length === 0 ? (
              <div className="py-5 text-center text-xs text-emerald-600 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>ممتاز! لا توجد أقساط متأخرة حالياً في أي مشروع.</span>
              </div>
            ) : (
              overdueByProject.map((proj) => {
                const percent = stats.totalOverdueAmount > 0 ? (proj.amount / stats.totalOverdueAmount) * 100 : 0;
                return (
                  <div key={proj.projectName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]" title={proj.projectName}>
                        {proj.projectName} ({proj.count} متأخر)
                      </span>
                      <span className="font-bold text-rose-700">{proj.amount.toLocaleString()} ج.م ({Math.round(percent)}%)</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-l from-rose-600 to-amber-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(10, percent))}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Dynamic Filters Panel */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Main Scope Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setScopeTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                scopeTab === 'all' 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              جميع الأقساط ({installments.length})
            </button>

            <button
              type="button"
              onClick={() => setScopeTab('overdue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                scopeTab === 'overdue' 
                  ? 'bg-rose-600 text-white shadow-sm' 
                  : 'text-rose-700 hover:bg-rose-50'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>الأقساط المتأخرة ({stats.totalOverdueCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setScopeTab('upcoming')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                scopeTab === 'upcoming' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>التحصيلات القادمة ({stats.totalUpcomingCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setScopeTab('paid')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                scopeTab === 'paid' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>المحصلة ({stats.totalPaidCount})</span>
            </button>
          </div>

          {/* Reset Filters Button */}
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold transition-colors px-2 py-1 rounded-lg hover:bg-slate-100"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط كل الفلاتر</span>
          </button>
        </div>

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Live Search Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              بحث في السجلات والعملاء
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اسم العميل، هاتف، عقد، وحدة، برج..."
                className="w-full pr-9 pl-8 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 2. Project Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              تصفية حسب المشروع
            </label>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setSelectedTowerId('all');
                }}
                className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-medium"
              >
                <option value="all">جميع المشروعات العقارية ({projects.length})</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. Tower Filter (Conditional or Active) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              تصفية حسب البرج / المبنى
            </label>
            <div className="relative">
              <select
                value={selectedTowerId}
                onChange={(e) => setSelectedTowerId(e.target.value)}
                disabled={availableTowers.length === 0}
                className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-medium disabled:opacity-50"
              >
                <option value="all">جميع الأبراج والمباني ({availableTowers.length})</option>
                {availableTowers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Building className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 4. Overdue Aging Severity Filter */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              شريحة التأخير (حسب مدة التعثر)
            </label>
            <div className="relative">
              <select
                value={overdueSeverity}
                onChange={(e) => setOverdueSeverity(e.target.value as OverdueSeverity)}
                className="w-full pr-9 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none font-medium"
              >
                <option value="all">كافة شرائح التأخير</option>
                <option value="gt_90">متأخر أكثر من 90 يوماً (تعثر حرج)</option>
                <option value="60_90">متأخر بين 60 إلى 90 يوماً</option>
                <option value="30_60">متأخر بين 30 إلى 60 يوماً</option>
                <option value="lt_30">متأخر أقل من 30 يوماً (تأخير حديث)</option>
              </select>
              <AlertCircle className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Date Filter Bar & Presets */}
        <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 ml-2 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>فترة الاستحقاق:</span>
            </span>
            {[
              { id: 'all', label: 'كافة التواريخ' },
              { id: 'overdue', label: 'متأخرة حالياً' },
              { id: 'next_7', label: 'خلال 7 أيام' },
              { id: 'next_30', label: 'خلال 30 يوم' },
              { id: 'this_month', label: 'الشهر الحالي' },
              { id: 'this_quarter', label: 'الربع الحالي' },
              { id: 'next_quarter', label: 'الربع القادم' },
              { id: 'this_year', label: 'العام الحالي' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyDatePreset(p.id as DatePreset)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                  datePreset === p.id 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">من:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold text-slate-700">إلى:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setDatePreset('all');
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                title="مسح نطاق التاريخ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 5. Dynamic Interactive Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Subheader with Active Filter Count */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-900">
              نتائج الأقساط المعروضة
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              {filteredInstallments.length} سجل
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div>
              إجمالي مبالغ العرض الحالي:{' '}
              <span className="text-slate-900 font-black text-sm">
                {filteredTotals.sumAmount.toLocaleString()} ج.م
              </span>
            </div>
          </div>
        </div>

        {filteredInstallments.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              title="لم يتم العثور على أي أقساط تطابق خيارات التصفية"
              description="جرب تغيير نطاق التاريخ، أو اختيار مشروع آخر، أو مسح نص البحث لعرض الأقساط."
              actionText="إعادة ضبط كل الفلاتر"
              onAction={handleResetFilters}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none">
                  <th className="py-3.5 px-4 text-center w-12">#</th>
                  <th className="py-3.5 px-4">رقم العقد وكود القسط</th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-700 group transition-colors"
                    onClick={() => handleSortToggle('client_name')}
                  >
                    <span>العميل والاتصال</span>
                    {renderSortIndicator('client_name')}
                  </th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-700 group transition-colors"
                    onClick={() => handleSortToggle('project_name')}
                  >
                    <span>المشروع والبرج</span>
                    {renderSortIndicator('project_name')}
                  </th>
                  <th className="py-3.5 px-4">الوحدة العقارية</th>
                  <th className="py-3.5 px-4">بيان القسط والدفعة</th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-700 group transition-colors"
                    onClick={() => handleSortToggle('due_date')}
                  >
                    <span>تاريخ الاستحقاق</span>
                    {renderSortIndicator('due_date')}
                  </th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-700 group transition-colors"
                    onClick={() => handleSortToggle('amount')}
                  >
                    <span>قيمة القسط</span>
                    {renderSortIndicator('amount')}
                  </th>
                  <th 
                    className="py-3.5 px-4 cursor-pointer hover:text-blue-700 group transition-colors"
                    onClick={() => handleSortToggle('overdue_days')}
                  >
                    <span>حالة القسط / الموقف</span>
                    {renderSortIndicator('overdue_days')}
                  </th>
                  <th className="py-3.5 px-4 text-center">الإجراء السريع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInstallments.map((inst, index) => {
                  const daysInfo = calculateDaysInfo(inst.due_date, inst.status);
                  const isPaid = inst.status === 'paid';
                  const isOverdue = !isPaid && (daysInfo.isPastDue || inst.status === 'overdue');

                  // Row background highlighting based on status
                  let rowBg = 'hover:bg-slate-50/80';
                  if (isOverdue) {
                    rowBg = daysInfo.overdueDays >= 60 
                      ? 'bg-rose-50/40 hover:bg-rose-50/80' 
                      : 'bg-amber-50/30 hover:bg-amber-50/70';
                  } else if (isPaid) {
                    rowBg = 'bg-emerald-50/20 hover:bg-emerald-50/60';
                  }

                  return (
                    <tr key={inst.id} className={`${rowBg} transition-colors`}>
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* Contract & Installment Code */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inst.contract_number}</div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{inst.id}</div>
                      </td>

                      {/* Client & Phone */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{inst.client_name}</span>
                        </div>
                        {inst.client_phone ? (
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 font-mono" dir="ltr">
                              {inst.client_phone}
                            </span>
                            <a
                              href={`tel:${inst.client_phone}`}
                              className="text-blue-600 hover:text-blue-800 p-0.5 rounded transition-colors"
                              title="اتصال هاتفي سريع"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">غير مسجل</span>
                        )}
                      </td>

                      {/* Project & Tower */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 truncate max-w-[180px]" title={inst.project_name}>
                          {inst.project_name}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="w-3 h-3 text-slate-400" />
                          <span>{inst.tower_name}</span>
                        </div>
                      </td>

                      {/* Unit Details */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">وحدة {inst.unit_number}</div>
                        <div className="text-[11px] text-slate-500">
                          {inst.unit_type === 'apartment' ? 'شقة' : inst.unit_type === 'duplex' ? 'دوبلكس' : inst.unit_type === 'clinic' ? 'عيادة' : inst.unit_type === 'commercial_shop' ? 'محل' : 'وحدة'}{' '}
                          ({inst.unit_area_sqm} م²)
                        </div>
                      </td>

                      {/* Installment Title & Number */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{inst.installment_title}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          دفعة <span className="font-bold text-blue-700">{inst.installment_number}</span> من {inst.total_installments_count}
                        </div>
                      </td>

                      {/* Due Date & Relative Timing */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono">{inst.due_date}</div>
                        <div className="mt-1">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>تم السداد {inst.payment_date || ''}</span>
                            </span>
                          ) : isOverdue ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              <span>متأخر منذ {daysInfo.overdueDays} يوماً</span>
                            </span>
                          ) : daysInfo.isToday ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                              <Clock className="w-3 h-3" />
                              <span>يستحق اليوم</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-blue-600" />
                              <span>متبقي {daysInfo.daysRemaining} يوماً</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-black text-slate-900 text-sm">
                          {inst.amount.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">ج.م</span>
                        </div>
                        {inst.total_unit_price && (
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            سعر الوحدة: {(inst.total_unit_price / 1000000).toFixed(2)} م
                          </div>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPaid ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 inline-block">
                              مسدد
                            </span>
                            <div className="text-[10px] text-slate-500">
                              {inst.payment_method === 'cash' ? 'نقدي' : inst.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                            </div>
                          </div>
                        ) : isOverdue ? (
                          <div className="space-y-0.5">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200 inline-block">
                              متأخر السداد
                            </span>
                            {daysInfo.overdueDays >= 60 && (
                              <div className="text-[10px] font-bold text-rose-600">تعثر مرتفع</div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 inline-block">
                            قيد الانتظار
                          </span>
                        )}
                      </td>

                      {/* Quick Action */}
                      <td className="py-3.5 px-4 text-center">
                        {isPaid ? (
                          <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>مكتمل</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenCollect(inst)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1 mx-auto transition-all active:scale-95"
                            title="تسجيل تحصيل القسط وإصدار سند قبض فوري"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>تحصيل الآن</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Dynamic Footer with Totals */}
              <tfoot>
                <tr className="bg-slate-100 text-slate-900 font-black border-t-2 border-slate-300">
                  <td colSpan={6} className="py-4 px-4 text-right">
                    إجمالي نتائج التقرير الحالي ({filteredInstallments.length} قسط مفلتر)
                  </td>
                  <td className="py-4 px-4 text-xs font-bold text-slate-600">
                    مجموع الاستحقاقات:
                  </td>
                  <td className="py-4 px-4 font-mono text-sm text-blue-900">
                    {filteredTotals.sumAmount.toLocaleString()} ج.م
                  </td>
                  <td colSpan={2} className="py-4 px-4 text-left text-xs text-slate-500 font-normal">
                    متأخر: <span className="text-rose-700 font-bold">{filteredTotals.overdueSum.toLocaleString()}</span> | قادم: <span className="text-blue-700 font-bold">{filteredTotals.upcomingSum.toLocaleString()}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* 6. Collect Payment Modal */}
      {collectModalOpen && selectedInstallmentForCollect && (
        <CollectPaymentModal
          isOpen={collectModalOpen}
          onClose={() => {
            setCollectModalOpen(false);
            setSelectedInstallmentForCollect(null);
          }}
          onSubmit={handleCollectSubmit}
          installment={selectedInstallmentForCollect}
          installmentsList={installments}
        />
      )}

      {/* 7. Receipt Print Modal */}
      {receiptToPrint && (
        <ReceiptPrintModal
          isOpen={!!receiptToPrint}
          onClose={() => setReceiptToPrint(null)}
          receipt={receiptToPrint}
        />
      )}

      {/* 8. Printable Formal Report Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden" dir="rtl">
            {/* Modal Top Bar */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-base">معاينة وطباعة تقرير الأقساط والتحصيل</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Body */}
            <div id="printable-installment-report" className="p-8 max-h-[75vh] overflow-y-auto space-y-6">
              {/* Official Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-900">شركة المقاولات والتطوير العقاري</h2>
                  <p className="text-xs text-slate-600 mt-0.5">الإدارة المالية - قسم الحسابات والتحصيل العقاري</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}</p>
                </div>
                <div className="text-left font-mono text-xs text-slate-500">
                  <div className="font-bold text-slate-900 text-sm">تقرير متابعة الأقساط</div>
                  <div>المستخدم: {user?.full_name || 'مدير النظام'}</div>
                  <div>الفلترة النشطة: {scopeTab === 'all' ? 'الكل' : scopeTab === 'overdue' ? 'المتأخرات فقط' : scopeTab === 'upcoming' ? 'التحصيلات القادمة' : 'المحصلة'}</div>
                </div>
              </div>

              {/* Metrics Summary Strip in Print */}
              <div className="grid grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                <div>
                  <div className="text-[11px] text-slate-500">إجمالي السجلات المعروضة</div>
                  <div className="text-base font-black text-slate-900 mt-0.5">{filteredInstallments.length} قسط</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">إجمالي المبالغ المستحقة</div>
                  <div className="text-base font-black text-blue-900 mt-0.5">{filteredTotals.sumAmount.toLocaleString()} ج.م</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">إجمالي المتأخرات</div>
                  <div className="text-base font-black text-rose-700 mt-0.5">{filteredTotals.overdueSum.toLocaleString()} ج.م</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500">إجمالي التحصيلات القادمة</div>
                  <div className="text-base font-black text-emerald-700 mt-0.5">{filteredTotals.upcomingSum.toLocaleString()} ج.م</div>
                </div>
              </div>

              {/* Printable Table */}
              <table className="w-full text-right border-collapse text-xs border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-300">
                    <th className="p-2 border border-slate-300 text-center w-8">م</th>
                    <th className="p-2 border border-slate-300">رقم العقد</th>
                    <th className="p-2 border border-slate-300">اسم العميل</th>
                    <th className="p-2 border border-slate-300">المشروع / البرج</th>
                    <th className="p-2 border border-slate-300">الوحدة</th>
                    <th className="p-2 border border-slate-300">الدفعة</th>
                    <th className="p-2 border border-slate-300">تاريخ الاستحقاق</th>
                    <th className="p-2 border border-slate-300">القيمة (ج.م)</th>
                    <th className="p-2 border border-slate-300">الموقف / الحالة</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInstallments.map((inst, i) => {
                    const daysInfo = calculateDaysInfo(inst.due_date, inst.status);
                    const isPaid = inst.status === 'paid';
                    const isOverdue = !isPaid && (daysInfo.isPastDue || inst.status === 'overdue');

                    return (
                      <tr key={inst.id} className="border-b border-slate-200">
                        <td className="p-2 border border-slate-300 text-center font-mono">{i + 1}</td>
                        <td className="p-2 border border-slate-300 font-mono font-bold">{inst.contract_number}</td>
                        <td className="p-2 border border-slate-300 font-semibold">{inst.client_name}</td>
                        <td className="p-2 border border-slate-300">{inst.project_name} - {inst.tower_name}</td>
                        <td className="p-2 border border-slate-300">{inst.unit_number}</td>
                        <td className="p-2 border border-slate-300">{inst.installment_number} من {inst.total_installments_count}</td>
                        <td className="p-2 border border-slate-300 font-mono">{inst.due_date}</td>
                        <td className="p-2 border border-slate-300 font-mono font-bold">{inst.amount.toLocaleString()}</td>
                        <td className="p-2 border border-slate-300 font-bold">
                          {isPaid ? (
                            <span className="text-emerald-700">مسدد</span>
                          ) : isOverdue ? (
                            <span className="text-rose-700">متأخر ({daysInfo.overdueDays} يوم)</span>
                          ) : (
                            <span className="text-blue-700">قادم ({daysInfo.daysRemaining} يوم)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-3 gap-6 text-center text-xs text-slate-700 font-bold">
                <div>
                  <p>مسؤول التحصيل العقاري</p>
                  <div className="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto" />
                </div>
                <div>
                  <p>مدير الحسابات المالية</p>
                  <div className="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto" />
                </div>
                <div>
                  <p>المدير العام والاعتماد</p>
                  <div className="mt-8 border-b border-dashed border-slate-400 w-36 mx-auto" />
                </div>
              </div>
            </div>

            {/* Modal Bottom Controls */}
            <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>إرسال إلى الطابعة الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
