import React, { useState } from 'react';
import { X, Building, Home, DollarSign, Layers } from 'lucide-react';
import { TowerUnit, UnitType, UnitStatus } from '../../types';

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (unit: any) => Promise<void>;
  towerId: string;
  towerName: string;
  projectId: string;
  projectName: string;
}

const UNIT_TYPE_OPTIONS: { key: UnitType; label: string }[] = [
  { key: 'apartment', label: 'شقة سكنية' },
  { key: 'duplex', label: 'دوبلكس فاخر' },
  { key: 'commercial_shop', label: 'محل تجاري' },
  { key: 'administrative_office', label: 'مكتب إداري' },
  { key: 'clinic', label: 'عيادة طبية' },
  { key: 'penthouse', label: 'بنتهاوس / روف' },
];

export const UnitModal: React.FC<UnitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  towerId,
  towerName,
  projectId,
  projectName,
}) => {
  const [unitNumber, setUnitNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('1');
  const [unitType, setUnitType] = useState<UnitType>('apartment');
  const [areaSqm, setAreaSqm] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [status, setStatus] = useState<UnitStatus>('available');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const area = parseFloat(areaSqm);
    const price = parseFloat(sellingPrice);
    const floor = parseInt(floorNumber, 10);

    if (!unitNumber.trim()) {
      setErrorMsg('يرجى كتابة رقم الوحدة.');
      return;
    }
    if (isNaN(area) || area <= 0) {
      setErrorMsg('يرجى إدخال مساحة صحيحة بالمتر المربع.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      setErrorMsg('يرجى إدخال سعر بيع تقديري للوحدة.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        tower_id: towerId,
        tower_name: towerName,
        project_id: projectId,
        project_name: projectName,
        unit_number: unitNumber.trim(),
        floor_number: floor,
        unit_type: unitType,
        area_sqm: area,
        selling_price: price,
        status,
        client_name: clientName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت إضافة الوحدة.');
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
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">إضافة وحدة جديدة بالبرج</h3>
              <p className="text-xs text-slate-300">{towerName} - {projectName}</p>
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
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الوحدة *</label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="مثال: 302"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم الطابق *</label>
              <input
                type="number"
                value={floorNumber}
                onChange={(e) => setFloorNumber(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">نوع الوحدة *</label>
              <select
                value={unitType}
                onChange={(e) => setUnitType(e.target.value as UnitType)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                {UNIT_TYPE_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المساحة (م²) *</label>
              <input
                type="number"
                step="any"
                value={areaSqm}
                onChange={(e) => setAreaSqm(e.target.value)}
                placeholder="مثال: 165"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">سعر البيع الإجمالي (ج.م) *</label>
              <input
                type="number"
                step="any"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="مثال: 3800000"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">حالة الوحدة</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UnitStatus)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="available">متاحة للبيع</option>
                <option value="reserved">محجوزة</option>
                <option value="sold">مباعة بعقد</option>
              </select>
            </div>
          </div>

          {status !== 'available' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">اسم العميل المشتري</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="اسم العميل الكامل"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات ومميزات الوحدة</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: بحري، فيو مفتوح على الحديقة"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
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
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold disabled:opacity-50"
            >
              {loading ? 'جاري الإضافة...' : 'حفظ الوحدة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
