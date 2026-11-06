import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  PackagePlus, 
  PackageMinus, 
  Warehouse as WarehouseIcon, 
  Search, 
  AlertTriangle, 
  Building, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  Plus,
  Phone,
  MapPin,
  HardHat
} from 'lucide-react';
import { MaterialItem, Warehouse, InventoryTransaction, MaterialCategory } from '../../types';
import { financialService } from '../../lib/financialService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { InwardReceiptModal } from './InwardReceiptModal';
import { OutwardIssueModal } from './OutwardIssueModal';
import { MaterialItemModal } from './MaterialItemModal';

const CATEGORY_NAMES: Record<MaterialCategory, string> = {
  concrete_structural: 'خرسانة وحديد وهيكل إنشائي',
  finishes: 'تشطيبات وسيراميك ودهانات',
  plumbing: 'صحي وسباكة ومحابس',
  electrical: 'كهرباء وكابلات وإنارة',
  insulation: 'عوازل مائية وحرارية',
  general: 'خامات ومعدات عامة',
};

export const InventoryView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [items, setItems] = useState<MaterialItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'warehouses'>('stock');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isOutwardModalOpen, setIsOutwardModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [selectedActionItemId, setSelectedActionItemId] = useState<string | undefined>(undefined);

  const loadData = async () => {
    setLoading(true);
    try {
      const [whs, itms, txs] = await Promise.all([
        financialService.getWarehouses(),
        financialService.getMaterialItems(),
        financialService.getInventoryTransactions(),
      ]);
      setWarehouses(whs);
      setItems(itms);
      setTransactions(txs);
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تحميل بيانات المستودعات والمواد الخام.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Stock Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchWh = selectedWarehouseId === 'all' || item.warehouse_id === selectedWarehouseId;
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchSearch = searchTerm === '' ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(searchTerm.toLowerCase());
      return matchWh && matchCat && matchSearch;
    });
  }, [items, selectedWarehouseId, selectedCategory, searchTerm]);

  // Filtered Movements
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchWh = selectedWarehouseId === 'all' || tx.warehouse_id === selectedWarehouseId;
      const matchSearch = searchTerm === '' ||
        tx.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.document_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.tower_name && tx.tower_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (tx.supplier_name && tx.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchWh && matchSearch;
    });
  }, [transactions, selectedWarehouseId, searchTerm]);

  // Statistics
  const totalStockValue = useMemo(() => {
    return filteredItems.reduce((sum, i) => sum + (Number(i.current_quantity || 0) * Number(i.avg_unit_cost || 0)), 0);
  }, [filteredItems]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => i.current_quantity <= i.min_stock_level).length;
  }, [items]);

  const totalOutwardAmount = useMemo(() => {
    return transactions
      .filter((tx) => tx.transaction_type === 'outward')
      .reduce((sum, tx) => sum + Number(tx.total_cost || 0), 0);
  }, [transactions]);

  // Handlers
  const handleInwardSubmit = async (data: any) => {
    if (!user) return;
    try {
      await financialService.addInwardInventoryReceipt(data, user);
      success('تم اعتماد إذن التوريد وزيادة رصيد المستودع بنجاح.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل تسجيل إذن التوريد.');
    }
  };

  const handleOutwardSubmit = async (data: any) => {
    if (!user) return;
    try {
      const res = await financialService.addOutwardIssueToTower(data, user);
      success(
        `تم صرف الخامات بنجاح وقيد تكلفة ${res.expense.amount.toLocaleString()} ج.م تلقائياً على ${res.expense.tower_name}!`
      );
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشل تسجيل إذن الصرف.');
    }
  };

  const handleItemSubmit = async (data: any) => {
    if (!user) return;
    try {
      const { initialQty, ...itemData } = data;
      await financialService.addMaterialItem(itemData, initialQty, user);
      success('تم تعريف صنف المادة الخام بنجاح.');
      await loadData();
    } catch (err: any) {
      error(err.message || 'فشلت إضافة الصنف.');
    }
  };

  const openInwardForItem = (itemId: string) => {
    setSelectedActionItemId(itemId);
    setIsInwardModalOpen(true);
  };

  const openOutwardForItem = (itemId: string) => {
    setSelectedActionItemId(itemId);
    setIsOutwardModalOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Controls & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Warehouse Filter */}
          <div className="flex items-center gap-2">
            <WarehouseIcon className="w-4 h-4 text-slate-500" />
            <select
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">كافة المستودعات والمخازن</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
          >
            <option value="all">كافة تصنيفات المواد الخام</option>
            {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasPermission('inventory', 'create') && (
            <button
              type="button"
              id="inward-receipt-btn"
              onClick={() => {
                setSelectedActionItemId(undefined);
                setIsInwardModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              <PackagePlus className="w-4 h-4" />
              <span>إذن إضافة وتوريد للمخزن</span>
            </button>
          )}

          {hasPermission('inventory', 'create') && (
            <button
              type="button"
              id="outward-issue-btn"
              onClick={() => {
                setSelectedActionItemId(undefined);
                setIsOutwardModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-sm"
            >
              <PackageMinus className="w-4 h-4" />
              <span>إذن صرف خامات على برج</span>
            </button>
          )}

          {hasPermission('inventory', 'create') && (
            <button
              type="button"
              id="add-material-item-btn"
              onClick={() => setIsItemModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>تعريف صنف خامات</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">القيمة التقديرية للمخزون</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900">
            {totalStockValue.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            {filteredItems.length} صنف خامات متوفر بالمستودعات
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">إجمالي المنصرف على الأبراج</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-amber-600">
            {totalOutwardAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">ج.م</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            محملة مباشرةً على تكاليف الأبراج
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">أصناف قاربت النفاد (حد الأمان)</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-rose-600">
            {lowStockCount} <span className="text-xs font-bold text-slate-500">أصناف</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            تتطلب إصدار أوامر شراء عاجلة
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">المستودعات الإنشائية النشطة</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <WarehouseIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-emerald-600">
            {warehouses.length} <span className="text-xs font-bold text-slate-500">مستودعات</span>
          </div>
          <div className="mt-1 text-xs text-slate-400">
            تخدم المشروعات بالمواقع والمقر المركزي
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('stock')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'stock'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          أرصدة المواد الخام ({filteredItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'movements'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          سجل حركات التوريد والصرف على الأبراج ({filteredTransactions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('warehouses')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'warehouses'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          المستودعات وأمناء المخازن ({warehouses.length})
        </button>
      </div>

      {/* TAB 1: STOCK BALANCES */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث باسم أو كود المادة الخام..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              إجمالي قيمة المخزون المعروض: <span className="font-bold text-slate-900">{totalStockValue.toLocaleString()} ج.م</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">كود الصنف</th>
                  <th className="p-3.5">اسم المادة الخام</th>
                  <th className="p-3.5">التصنيف</th>
                  <th className="p-3.5">المستودع الحالي</th>
                  <th className="p-3.5">الرصيد الحالي</th>
                  <th className="p-3.5">متوسط التكلفة</th>
                  <th className="p-3.5">إجمالي القيمة (ج.م)</th>
                  <th className="p-3.5">حالة المخزون</th>
                  <th className="p-3.5 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا توجد أصناف خامات مطابقة لمعايير البحث.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const totalVal = Number(item.current_quantity) * Number(item.avg_unit_cost);
                    const isLow = item.current_quantity <= item.min_stock_level;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                          {item.code}
                        </td>
                        <td className="p-3.5 font-bold text-slate-900">
                          {item.name}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-600">
                          {CATEGORY_NAMES[item.category] || item.category}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-500">
                          {item.warehouse_name || 'مستودع الموقع'}
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-black text-sm text-slate-900">
                          {item.current_quantity} <span className="text-xs font-medium text-slate-500">{item.unit}</span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-slate-600 font-semibold">
                          {Number(item.avg_unit_cost).toLocaleString()} ج.م/{item.unit}
                        </td>
                        <td className="p-3.5 whitespace-nowrap font-black text-emerald-700">
                          {totalVal.toLocaleString()} ج.م
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isLow
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}>
                            {isLow ? (
                              <>
                                <AlertTriangle className="w-3 h-3" />
                                <span>طلب شراء عاجل</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                <span>رصيد كافٍ</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {hasPermission('inventory', 'create') && (
                              <button
                                type="button"
                                onClick={() => openInwardForItem(item.id)}
                                title="إضافة توريد للمخزن"
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition-colors"
                              >
                                توريد +
                              </button>
                            )}
                            {hasPermission('inventory', 'create') && (
                              <button
                                type="button"
                                onClick={() => openOutwardForItem(item.id)}
                                title="صرف على برج تحت التنفيذ"
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-[11px] font-bold transition-colors"
                              >
                                صرف برج -
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

      {/* TAB 2: INVENTORY TRANSACTIONS / MOVEMENTS */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث برقم الإذن أو الصنف أو البرج..."
                className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div className="text-xs text-slate-500">
              إجمالي الحركات: <span className="font-bold text-slate-800">{filteredTransactions.length}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">نوع الإذن</th>
                  <th className="p-3.5">رقم الإذن</th>
                  <th className="p-3.5">التاريخ</th>
                  <th className="p-3.5">المادة الخام</th>
                  <th className="p-3.5">الكمية</th>
                  <th className="p-3.5">إجمالي التكلفة</th>
                  <th className="p-3.5">المستودع</th>
                  <th className="p-3.5">الوجهة / المستفيد</th>
                  <th className="p-3.5">المهندس / المورد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لا توجد أذون توريد أو صرف مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          tx.transaction_type === 'inward'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {tx.transaction_type === 'inward' ? (
                            <>
                              <PackagePlus className="w-3.5 h-3.5" />
                              <span>إذن إضافة توريد</span>
                            </>
                          ) : (
                            <>
                              <PackageMinus className="w-3.5 h-3.5" />
                              <span>إذن صرف برج</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {tx.document_number}
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">{tx.transaction_date}</td>
                      <td className="p-3.5 font-bold text-slate-800 whitespace-nowrap">
                        {tx.item_name}
                      </td>
                      <td className="p-3.5 font-black text-slate-900 whitespace-nowrap">
                        {tx.quantity}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {tx.total_cost.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 text-slate-600 whitespace-nowrap">
                        {tx.warehouse_name}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {tx.transaction_type === 'outward' ? (
                          <div className="font-bold text-blue-700">
                            {tx.tower_name || 'برج تحت التنفيذ'}
                          </div>
                        ) : (
                          <div className="font-semibold text-slate-700">
                            {tx.supplier_name || 'توريد للمخزن'}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap text-slate-600">
                        {tx.engineer_recipient || tx.supplier_name || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WAREHOUSES DIRECTORY */}
      {activeTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {warehouses.map((wh) => {
            const whItems = items.filter((i) => i.warehouse_id === wh.id);
            const whStockVal = whItems.reduce((sum, i) => sum + (i.current_quantity * i.avg_unit_cost), 0);
            return (
              <div key={wh.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <WarehouseIcon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">
                    {wh.code}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{wh.name}</h4>
                  <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {wh.location}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">أمين المستودع:</span>
                    <span className="font-bold text-slate-900">{wh.keeper_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">رقم الهاتف:</span>
                    <span className="font-bold text-slate-900 flex items-center gap-1" dir="ltr">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {wh.phone}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">قيمة الخامات بالمخزن:</span>
                    <span className="font-black text-emerald-700">{whStockVal.toLocaleString()} ج.م</span>
                  </div>
                </div>

                {wh.notes && (
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "{wh.notes}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Global Modals */}
      <InwardReceiptModal
        isOpen={isInwardModalOpen}
        onClose={() => setIsInwardModalOpen(false)}
        onSubmit={handleInwardSubmit}
        items={items}
        warehouses={warehouses}
        defaultItemId={selectedActionItemId}
      />

      <OutwardIssueModal
        isOpen={isOutwardModalOpen}
        onClose={() => setIsOutwardModalOpen(false)}
        onSubmit={handleOutwardSubmit}
        items={items}
        warehouses={warehouses}
        defaultItemId={selectedActionItemId}
      />

      <MaterialItemModal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        onSubmit={handleItemSubmit}
        warehouses={warehouses}
      />
    </div>
  );
};
