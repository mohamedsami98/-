import React, { useState } from 'react';
import { X, Package, Warehouse as WarehouseIcon } from 'lucide-react';
import { MaterialCategory, Warehouse } from '../../types';

interface MaterialItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  warehouses: Warehouse[];
}

const CATEGORY_OPTIONS: { key: MaterialCategory; label: string }[] = [
  { key: 'concrete_structural', label: 'خرسانة وحديد وهيكل إنشائي' },
  { key: 'finishes', label: 'تشطيبات وسيراميك ودهانات' },
  { key: 'plumbing', label: 'صحي وسباكة ومحابس' },
  { key: 'electrical', label: 'كهرباء وكابلات وإنارة' },
  { key: 'insulation', label: 'عوازل مائية وحرارية' },
  { key: 'general', label: 'خامات ومعدات موقع عامة' },
];

export const MaterialItemModal: React.FC<MaterialItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  warehouses,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<MaterialCategory>('concrete_structural');
  const [unit, setUnit] = useState('طن');
  const [initialQty, setInitialQty] = useState('0');
  const [avgUnitCost, setAvgUnitCost] = useState('');
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cost = parseFloat(avgUnitCost);
    const qty = parseFloat(initialQty) || 0;
    const minLevel = parseFloat(minStockLevel) || 0;

    if (!code.trim() || !name.trim()) {
      setErrorMsg('يرجى ملء كود واسم الصنف.');
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      setErrorMsg('يرجى إدخال تكلفة الوحدة التقديرية.');
      return;
    }

    const wh = warehouses.find((w) => w.id === warehouseId);

    setLoading(true);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        unit: unit.trim(),
        avg_unit_cost: cost,
        min_stock_level: minLevel,
        warehouse_id: warehouseId,
        warehouse_name: wh?.name || '',
        initialQty: qty,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت إضافة الصنف.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
        <div className="px-6 py-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">تعريف مادة خام جديدة</h3>
              <p className="text-xs text-slate-300">إضافة صنف جديد لكتالوج الخامات والمستودعات</p>
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">كود الصنف (الباركود) *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="مثال: MAT-ST-18"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">تصنيف المادة الخام *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MaterialCategory)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">اسم المادة الخام والمواصفة *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: حديد تسليح عز قياسي قطر 18 مم"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">وحدة القياس *</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="طن، متر مكعب، شيكارة، لفة"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المستودع الرئيسي *</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">سعر الوحدة (ج.م) *</label>
              <input
                type="number"
                step="any"
                value={avgUnitCost}
                onChange={(e) => setAvgUnitCost(e.target.value)}
                placeholder="39500"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الرصيد الافتتاحي</label>
              <input
                type="number"
                step="any"
                value={initialQty}
                onChange={(e) => setInitialQty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">حد الأمان (الحد الأدنى)</label>
              <input
                type="number"
                step="any"
                value={minStockLevel}
                onChange={(e) => setMinStockLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
            >
              {loading ? 'جاري الحفظ...' : 'حفظ الصنف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
