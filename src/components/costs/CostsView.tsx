import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Receipt, 
  Building2, 
  Building, 
  Plus, 
  Calculator, 
  Layers, 
  Search, 
  Trash2, 
  Home, 
  TrendingUp,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';
import { Expense, TowerUnit, Project, Tower, CostCategory } from '../../types';
import { dataService } from '../../lib/supabase';
import { financialService } from '../../lib/financialService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ExpenseFormModal } from './ExpenseFormModal';
import { UnitModal } from './UnitModal';

const CATEGORY_NAMES: Record<CostCategory, string> = {
  building_materials: 'مواد بناء وتوريدات خرسانية',
  labor_subcontractors: 'أجور ومصنعيات ومقاولين باطن',
  machinery_equipment: 'إيجار وتشغيل معدات وآليات',
  engineering_supervision: 'إشراف هندسي واستشارات',
  site_administrative: 'مصاريف موقع وإدارية',
  permits_fees: 'تراخيص ورسوم وتأمينات',
  other: 'مصروفات أخرى متنوعة',
};

const CATEGORY_COLORS: Record<CostCategory, string> = {
  building_materials: 'bg-blue-500',
  labor_subcontractors: 'bg-amber-500',
  machinery_equipment: 'bg-orange-500',
  engineering_supervision: 'bg-purple-500',
  site_administrative: 'bg-emerald-500',
  permits_fees: 'bg-rose-500',
  other: 'bg-slate-500',
};

export const CostsView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { success, error, info } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [selectedTowerId, setSelectedTowerId] = useState<string>('all');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [units, setUnits] = useState<TowerUnit[]>([]);
  const [activeTab, setActiveTab] = useState<'expenses' | 'units_allocation' | 'analytics'>('expenses');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isUnitModalOpen, setIsUnitModalOpen] = useState(false);
  const [allocating, setAllocating] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [projs, tows, exps, unts] = await Promise.all([
        dataService.getProjects(),
        dataService.getTowers(),
        financialService.getExpenses(),
        financialService.getUnits(),
      ]);
      setProjects(projs);
      setTowers(tows);
      setExpenses(exps);
      setUnits(unts);

      if (tows.length > 0 && selectedTowerId === 'all') {
        setSelectedTowerId(tows[0].id);
        setSelectedProjectId(tows[0].project_id);
      }
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تحميل بيانات التكاليف والمصروفات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered towers by project
  const availableTowers = useMemo(() => {
    if (selectedProjectId === 'all') return towers;
    return towers.filter((t) => t.project_id === selectedProjectId);
  }, [towers, selectedProjectId]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchProject = selectedProjectId === 'all' || e.project_id === selectedProjectId;
      const matchTower = selectedTowerId === 'all' || e.tower_id === selectedTowerId;
      const matchSearch = searchTerm === '' || 
        e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.supplier_beneficiary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.invoice_number && e.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchProject && matchTower && matchSearch;
    });
  }, [expenses, selectedProjectId, selectedTowerId, searchTerm]);

  // Filtered units
  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchProject = selectedProjectId === 'all' || u.project_id === selectedProjectId;
      const matchTower = selectedTowerId === 'all' || u.tower_id === selectedTowerId;
      return matchProject && matchTower;
    });
  }, [units, selectedProjectId, selectedTowerId]);

  // Aggregated totals
  const totalTowerExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  }, [filteredExpenses]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + Number(e.amount || 0);
    });
    return map;
  }, [filteredExpenses]);

  const totalUnitsArea = useMemo(() => {
    return filteredUnits.reduce((sum, u) => sum + Number(u.area_sqm || 0), 0);
  }, [filteredUnits]);

  const currentTower = useMemo(() => {
    return towers.find((t) => t.id === selectedTowerId);
  }, [towers, selectedTowerId]);

  const currentProject = useMemo(() => {
    return projects.find((p) => p.id === (currentTower ? currentTower.project_id : selectedProjectId));
  }, [projects, currentTower, selectedProjectId]);

  // Handle Add Expense
  const handleExpenseSubmit = async (expenseData: any) => {
    if (!user) return;
    try {
      await financialService.addExpense(expenseData, user);
      success('تم قيد المصروف بنجاح وخصمه من الحساب المحدد.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشلت إضافة المصروف.');
    }
  };

  // Handle Delete Expense
  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
      await financialService.deleteExpense(id, user);
      success('تم حذف المصروف بنجاح.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل حذف المصروف.');
    }
  };

  // Handle Add Unit
  const handleUnitSubmit = async (unitData: any) => {
    if (!user) return;
    try {
      await financialService.addUnit(unitData, user);
      success('تمت إضافة الوحدة بنجاح إلى البرج.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشلت إضافة الوحدة.');
    }
  };

  // Handle Distribute / Allocate Costs on Units
  const handleAllocateCosts = async () => {
    if (!user) return;
    if (selectedTowerId === 'all') {
      info('يرجى تحديد برج محدد لتوزيع التكاليف على وحداته.');
      return;
    }
    if (filteredUnits.length === 0) {
      error('لا توجد وحدات مسجلة بهذا البرج. يرجى إضافة وحدات أولاً.');
      return;
    }

    setAllocating(true);
    try {
      const res = await financialService.allocateTowerCostsToUnits(selectedTowerId, user);
      success(
        `تم توزيع إجمالي تكاليف ${res.towerName} البالغة ${res.totalCost.toLocaleString()} ج.م على ${res.updatedUnitsCount} وحدة بمعدل ${res.costPerSqm.toLocaleString()} ج.م/م² بنجاح!`
      );
      await loadData();
      setActiveTab('units_allocation');
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء توزيع التكاليف.');
    } finally {
      setAllocating(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Project Filter */}
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-500" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const pId = e.target.value;
                setSelectedProjectId(pId);
                const related = towers.filter((t) => pId === 'all' || t.project_id === pId);
                if (related.length > 0) {
                  setSelectedTowerId(related[0].id);
                } else {
                  setSelectedTowerId('all');
                }
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">كافة المشروعات</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Tower Filter */}
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-amber-500" />
            <select
              value={selectedTowerId}
              onChange={(e) => setSelectedTowerId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">كافة الأبراج</option>
              {availableTowers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.floors_count} دور)</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('costs', 'create') && (
            <button
              type="button"
              id="distribute-costs-btn"
              onClick={handleAllocateCosts}
              disabled={allocating || selectedTowerId === 'all'}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>{allocating ? 'جاري التوزيع...' : 'توزيع التكاليف على الوحدات (م²)'}</span>
            </button>
          )}

          {hasPermission('costs', 'create') && (
            <button
              type="button"
              id="add-expense-btn"
              onClick={() => setIsExpenseModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>قيد مصروف على البرج</span>
            </button>
          )}

          {hasPermission('towers', 'create') && selectedTowerId !== 'all' && (
            <button
              type="button"
              id="add-unit-btn"
              onClick={() => setIsUnitModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>إضافة وحدة بالبرج</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي تكاليف ومصروفات البرج</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {totalTowerExpenses.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {filteredExpenses.length} سند صرف وفاتورة مسجلة
          </div>
        </div>

        {/* Total Units Area */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي مساحات الوحدات</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {totalUnitsArea.toLocaleString()} <span className="text-xs font-bold text-slate-500">م²</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {filteredUnits.length} وحدة مسجلة بالبرج
          </div>
        </div>

        {/* Cost per sqm */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">معدل تكلفة المتر المربع (م²)</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">
            {totalUnitsArea > 0 ? Math.round(totalTowerExpenses / totalUnitsArea).toLocaleString() : 0} <span className="text-xs font-bold text-slate-500">ج.م/م²</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            أساس التوزيع العادل على الوحدات
          </div>
        </div>

        {/* Total Selling Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">القيمة البيعية الإجمالية للوحدات</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-purple-600">
            {filteredUnits.reduce((sum, u) => sum + Number(u.selling_price || 0), 0).toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-medium">
            هامش ربح تقديري: {totalTowerExpenses > 0 ? (
              Math.round(((filteredUnits.reduce((sum, u) => sum + Number(u.selling_price || 0), 0) - totalTowerExpenses) / totalTowerExpenses) * 100)
            ) : 0}%
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'expenses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل المصروفات والتكاليف الفردية ({filteredExpenses.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('units_allocation')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'units_allocation'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          توزيع التكاليف على الوحدات ({filteredUnits.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          التحليل النسبي لبنود التكلفة
        </button>
      </div>

      {/* TAB 1: EXPENSES LEDGER */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Table Search Bar */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث بالبيان أو المورد أو رقم الفاتورة..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              إجمالي المعروض: <span className="font-bold text-slate-800">{totalTowerExpenses.toLocaleString()} ج.م</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">تاريخ القيد</th>
                  <th className="p-3.5">البرج / المشروع</th>
                  <th className="p-3.5">بند التكلفة</th>
                  <th className="p-3.5">بيان المصروف</th>
                  <th className="p-3.5">المورد / المستفيد</th>
                  <th className="p-3.5">طريقة الدفع والحساب</th>
                  <th className="p-3.5">المبلغ (ج.م)</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      لا توجد مصروفات مسجلة مطابقة للبحث أو للبرج المحدد.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{exp.expense_date}</td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{exp.tower_name || 'البرج'}</div>
                        <div className="text-[11px] text-slate-400">{exp.project_name}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white ${CATEGORY_COLORS[exp.category] || 'bg-slate-600'}`}>
                          {exp.category_ar || CATEGORY_NAMES[exp.category]}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-slate-900 truncate">{exp.description}</div>
                        {exp.invoice_number && (
                          <div className="text-[11px] text-blue-600">فاتورة: {exp.invoice_number}</div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap font-semibold text-slate-800">
                        {exp.supplier_beneficiary}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="text-slate-800 font-semibold">
                          {exp.payment_method === 'cash' ? 'نقدي' : exp.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                        </div>
                        <div className="text-[11px] text-slate-400">{exp.bank_account_name || '-'}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-sm font-black text-slate-900">
                        {Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-center">
                        {hasPermission('costs', 'delete') && (
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp.id)}
                            title="حذف المصروف"
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* TAB 2: UNIT COST ALLOCATION */}
      {activeTab === 'units_allocation' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-900 text-xs">
            <Calculator className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">آلية توزيع التكاليف الإنشائية على الوحدات:</span> يقوم النظام بحساب مجموع كافة التكاليف المصروفة على البرج ({totalTowerExpenses.toLocaleString()} ج.م) وقسمتها على إجمالي مساحة الوحدات ({totalUnitsArea} م²) لحساب التكلفة الفعلية للمتر المربع ({totalUnitsArea > 0 ? Math.round(totalTowerExpenses / totalUnitsArea).toLocaleString() : 0} ج.م/م²)، ومن ثم تحميل كل وحدة بنصيبها العادل من التكلفة مقارنةً بسعر البيع وهامش الربحية.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">رقم الوحدة</th>
                    <th className="p-3.5">النوع</th>
                    <th className="p-3.5">الطابق</th>
                    <th className="p-3.5">المساحة (م²)</th>
                    <th className="p-3.5">التكلفة المحملة (ج.م)</th>
                    <th className="p-3.5">تكلفة المتر (ج.م/م²)</th>
                    <th className="p-3.5">سعر البيع (ج.م)</th>
                    <th className="p-3.5">الربح التقديري (ج.م)</th>
                    <th className="p-3.5">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        لا توجد وحدات مسجلة لهذا البرج بعد. اضغط على زر "إضافة وحدة بالبرج" أعلاه.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u) => {
                      const allocatedCost = u.allocated_cost || (totalUnitsArea > 0 ? Math.round(u.area_sqm * (totalTowerExpenses / totalUnitsArea)) : 0);
                      const costPerM = u.cost_per_sqm || (u.area_sqm > 0 ? Math.round(allocatedCost / u.area_sqm) : 0);
                      const profit = Number(u.selling_price || 0) - allocatedCost;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                            وحدة {u.unit_number}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {u.unit_type === 'apartment' ? 'شقة سكنية' : u.unit_type === 'duplex' ? 'دوبلكس' : u.unit_type === 'commercial_shop' ? 'محل تجاري' : u.unit_type === 'administrative_office' ? 'مكتب إداري' : 'أخرى'}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">الدور {u.floor_number}</td>
                          <td className="p-3.5 font-bold whitespace-nowrap text-slate-800">{u.area_sqm} م²</td>
                          <td className="p-3.5 font-bold text-amber-600 whitespace-nowrap">
                            {allocatedCost > 0 ? allocatedCost.toLocaleString() : 'لم يتم التوزيع'}
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-semibold text-slate-600">
                            {costPerM > 0 ? `${costPerM.toLocaleString()} ج.م/م²` : '-'}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                            {Number(u.selling_price).toLocaleString()}
                          </td>
                          <td className={`p-3.5 font-bold whitespace-nowrap ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {allocatedCost > 0 ? profit.toLocaleString() : '-'}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[11px] font-bold ${
                              u.status === 'sold'
                                ? 'bg-blue-100 text-blue-700'
                                : u.status === 'reserved'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {u.status === 'sold' ? 'مباعة' : u.status === 'reserved' ? 'محجوزة' : 'متاحة'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & PROPORTIONAL BREAKDOWN */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Breakdown Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">توزيع التكاليف حسب البنود الإنشائية</h4>
            <div className="space-y-3">
              {Object.entries(categoryBreakdown).map(([catKey, catAmount]) => {
                const percentage = totalTowerExpenses > 0 ? Math.round((catAmount / totalTowerExpenses) * 100) : 0;
                const cat = catKey as CostCategory;
                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700">{CATEGORY_NAMES[cat] || catKey}</span>
                      <span className="text-slate-900 font-bold">{catAmount.toLocaleString()} ج.م ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${CATEGORY_COLORS[cat] || 'bg-blue-500'}`} 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Tower Summary & Status */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-900">بيانات البرج الإنشائي</h4>
            {currentTower ? (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold">اسم البرج:</span>
                  <span className="font-bold text-slate-900">{currentTower.name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold">المشروع التابع له:</span>
                  <span className="font-bold text-slate-900">{currentProject?.name || '-'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold">عدد الأدوار الإنشائية:</span>
                  <span className="font-bold text-slate-900">{currentTower.floors_count} دور</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold">نسبة الإنجاز الفعلي:</span>
                  <span className="font-bold text-blue-600">{currentTower.completion_rate ?? currentTower.actual_completion_percentage ?? 0}%</span>
                </div>
                <div className="flex justify-between py-2 border-b border-slate-100">
                  <span className="font-semibold">تاريخ البدء المتوقع:</span>
                  <span className="font-medium text-slate-900">{currentTower.start_date || '-'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">حدد برجاً معيناً لمشاهدة التحليل الخاص به.</p>
            )}
          </div>
        </div>
      )}

      {/* Global Modals */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={handleExpenseSubmit}
        defaultTowerId={selectedTowerId !== 'all' ? selectedTowerId : undefined}
        defaultProjectId={selectedProjectId !== 'all' ? selectedProjectId : undefined}
      />

      {selectedTowerId !== 'all' && currentTower && (
        <UnitModal
          isOpen={isUnitModalOpen}
          onClose={() => setIsUnitModalOpen(false)}
          onSubmit={handleUnitSubmit}
          towerId={currentTower.id}
          towerName={currentTower.name}
          projectId={currentTower.project_id}
          projectName={currentProject?.name || ''}
        />
      )}
    </div>
  );
};
