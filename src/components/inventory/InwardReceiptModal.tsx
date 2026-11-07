import React, { useState, useEffect } from 'react';
import { X, PackagePlus, Truck, Calendar, FileText, DollarSign, Users } from 'lucide-react';
import { MaterialItem, Warehouse, Supplier } from '../../types';
import { financialService } from '../../lib/financialService';

interface InwardReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  items: MaterialItem[];
  warehouses: Warehouse[];
  defaultItemId?: string;
}

export const InwardReceiptModal: React.FC<InwardReceiptModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  warehouses,
  defaultItemId,
}) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [itemId, setItemId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [unitPrice, setUnitPrice] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    financialService.getSuppliers().then((sups) => {
      setSuppliers(sups);
    }).catch(console.error);

    const initialItem = items.find((i) => i.id === defaultItemId) || items[0];
    if (initialItem) {
      setItemId(initialItem.id);
      setWarehouseId(initialItem.warehouse_id || (warehouses[0]?.id || ''));
      setUnitPrice(String(initialItem.avg_unit_cost || ''));
    }
    setDocumentNumber(`INV-IN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [isOpen, defaultItemId, items, warehouses]);

  const selectedItem = items.find((i) => i.id === itemId);

  const handleItemChange = (id: string) => {
    setItemId(id);
    const itm = items.find((i) => i.id === id);
    if (itm) {
      setWarehouseId(itm.warehouse_id || (warehouses[0]?.id || ''));
      setUnitPrice(String(itm.avg_unit_cost || ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedQty = parseFloat(quantity);
    const parsedPrice = parseFloat(unitPrice);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMsg('يرجى إدخال كمية توريد صحيحة.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setErrorMsg('يرجى إدخال سعر توريد صحيح للوحدة.');
      return;
    }
    if (!supplierName.trim()) {
      setErrorMsg('يرجى إدخال اسم شركة التوريد أو المصنع.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        item_id: itemId,
        warehouse_id: warehouseId,
        quantity: parsedQty,
        unit_price: parsedPrice,
        document_number: documentNumber.trim(),
        supplier_name: supplierName.trim(),
        transaction_date: transactionDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت إضافة إذن التوريد.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totalCost = (parseFloat(quantity) || 0) * (parseFloat(unitPrice) || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">إذن إضافة وتوريد مواد خام للمخزن</h3>
              <p className="text-xs text-slate-300">تسجيل شحنة خامات جديدة وزيادة رصيد المستودع</p>
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
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">صنف المادة الخام *</label>
            <select
              value={itemId}
              onChange={(e) => handleItemChange(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.code}) - الرصيد الحالي: {i.current_quantity} {i.unit}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المستودع المستقبل *</label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم إذن التوريد / البوليصة *</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الكمية الموردة ({selectedItem?.unit || 'وحدة'}) *
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="مثال: 50"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">سعر الوحدة (ج.م) *</label>
              <input
                type="number"
                step="any"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="مثال: 39500"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {totalCost > 0 && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-semibold">
              <span>إجمالي تكلفة الشحنة الموردة:</span>
              <span className="text-sm font-black">{totalCost.toLocaleString()} ج.م</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  المورد / المصنع *
                </label>
                {suppliers.length > 0 && (
                  <span className="text-[10px] text-blue-600">من الدليل أو كتابة</span>
                )}
              </div>

              {suppliers.length > 0 && (
                <div className="mb-1.5">
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      const supId = e.target.value;
                      setSelectedSupplierId(supId);
                      const s = suppliers.find((x) => x.id === supId);
                      if (s) {
                        setSupplierName(s.name);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-blue-50/50 border border-blue-200 text-blue-950 rounded-lg text-xs font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="">-- اختيار من دليل الموردين --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category_ar || s.category})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <input
                type="text"
                value={supplierName}
                onChange={(e) => {
                  setSupplierName(e.target.value);
                  setSelectedSupplierId('');
                }}
                placeholder="مثال: مصنع حديد عز أو شركة توريد"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                تاريخ الاستلام الفعلي *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ملاحظات وشهادات الفحص الفني</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: مطابقة للمواصفة القياسية المصرية رقم 262"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            >
              {loading ? 'جاري الاعتماد...' : 'اعتماد إذن الإضافة والتوريد'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
