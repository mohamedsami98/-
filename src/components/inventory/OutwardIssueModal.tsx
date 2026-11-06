import React, { useState, useEffect } from 'react';
import { X, PackageMinus, Building2, Building, HardHat, Calendar, AlertTriangle } from 'lucide-react';
import { MaterialItem, Warehouse, Project, Tower } from '../../types';
import { dataService } from '../../lib/supabase';

interface OutwardIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  items: MaterialItem[];
  warehouses: Warehouse[];
  defaultItemId?: string;
}

export const OutwardIssueModal: React.FC<OutwardIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  items,
  warehouses,
  defaultItemId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [towers, setTowers] = useState<Tower[]>([]);
  const [filteredTowers, setFilteredTowers] = useState<Tower[]>([]);

  const [itemId, setItemId] = useState<string>('');
  const [warehouseId, setWarehouseId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [towerId, setTowerId] = useState<string>('');
  const [engineerRecipient, setEngineerRecipient] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    const loadProjectsAndTowers = async () => {
      try {
        const [projs, tows] = await Promise.all([
          dataService.getProjects(),
          dataService.getTowers(),
        ]);
        setProjects(projs);
        setTowers(tows);

        if (projs.length > 0) {
          setProjectId(projs[0].id);
          const related = tows.filter((t) => t.project_id === projs[0].id);
          setFilteredTowers(related);
          if (related.length > 0) {
            setTowerId(related[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading projects/towers', err);
      }
    };
    loadProjectsAndTowers();

    const initialItem = items.find((i) => i.id === defaultItemId) || items[0];
    if (initialItem) {
      setItemId(initialItem.id);
      setWarehouseId(initialItem.warehouse_id || (warehouses[0]?.id || ''));
    }
    setDocumentNumber(`ISS-OUT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
  }, [isOpen, defaultItemId, items, warehouses]);

  const selectedItem = items.find((i) => i.id === itemId);

  const handleProjectChange = (pId: string) => {
    setProjectId(pId);
    const related = towers.filter((t) => t.project_id === pId);
    setFilteredTowers(related);
    setTowerId(related.length > 0 ? related[0].id : '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const parsedQty = parseFloat(quantity);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      setErrorMsg('يرجى إدخال كمية صرف صحيحة أكبر من الصفر.');
      return;
    }
    if (selectedItem && parsedQty > selectedItem.current_quantity) {
      setErrorMsg(`الكمية المطلوبة (${parsedQty} ${selectedItem.unit}) تتجاوز الرصيد المتوفر بالمستودع (${selectedItem.current_quantity} ${selectedItem.unit}).`);
      return;
    }
    if (!projectId || !towerId) {
      setErrorMsg('يرجى اختيار المشروع والبرج تحت التنفيذ المطلوب الصرف له.');
      return;
    }
    if (!engineerRecipient.trim()) {
      setErrorMsg('يرجى كتابة اسم المهندس أو المشرف المستلم في الموقع.');
      return;
    }

    const selectedProj = projects.find((p) => p.id === projectId);
    const selectedTower = towers.find((t) => t.id === towerId);

    setLoading(true);
    try {
      await onSubmit({
        item_id: itemId,
        warehouse_id: warehouseId,
        quantity: parsedQty,
        project_id: projectId,
        project_name: selectedProj?.name || '',
        tower_id: towerId,
        tower_name: selectedTower?.name || '',
        document_number: documentNumber.trim(),
        engineer_recipient: engineerRecipient.trim(),
        transaction_date: transactionDate,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشلت عملية صرف المواد.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const estimatedCost = (parseFloat(quantity) || 0) * (selectedItem?.avg_unit_cost || 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-l from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <PackageMinus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold">إذن صرف خامات لبرج تحت التنفيذ</h3>
              <p className="text-xs text-slate-300">صرف مباشر من المستودع وتحميل التكلفة آلياً على البرج</p>
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
          {/* Material Item & Stock Alert */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">صنف المادة الخام المراد صرفها *</label>
            <select
              value={itemId}
              onChange={(e) => {
                setItemId(e.target.value);
                const itm = items.find((i) => i.id === e.target.value);
                if (itm) setWarehouseId(itm.warehouse_id);
              }}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.code}) - الرصيد المتوفر: {i.current_quantity} {i.unit} (متوسط التكلفة: {i.avg_unit_cost.toLocaleString()} ج.م)
                </option>
              ))}
            </select>
          </div>

          {/* Source Warehouse & Document Number */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">المستودع المصروف منه *</label>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">رقم إذن الصرف *</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Target Project & Target Tower */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                المشروع الإنشائي *
              </label>
              <select
                value={projectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-amber-600" />
                البرج تحت التنفيذ (المستفيد) *
              </label>
              <select
                value={towerId}
                onChange={(e) => setTowerId(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
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

          {/* Quantity & Recipient Engineer */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                الكمية المصروفة ({selectedItem?.unit || 'وحدة'}) *
              </label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="مثال: 15"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <HardHat className="w-3.5 h-3.5 text-indigo-600" />
                المهندس أو المشرف المستلم *
              </label>
              <input
                type="text"
                value={engineerRecipient}
                onChange={(e) => setEngineerRecipient(e.target.value)}
                placeholder="مثال: المهندس حسام ممدوح"
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Automatic Tower Cost Notice */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-start gap-2 text-xs text-blue-900">
            <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">قيد محاسبي تلقائي:</span> سيقوم النظام فوراً بخصم الكمية المصروفة من رصيد المستودع، وإنشاء قيد تكلفة مباشر بقيمة تقديرية <span className="font-bold text-blue-700">({estimatedCost.toLocaleString()} ج.م)</span> تضاف تلقائياً لمصروفات البرج المختار تحت بند مواد البناء!
            </div>
          </div>

          {/* Date & Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                تاريخ الصرف والتسليم *
              </label>
              <input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">الاستخدام الموقعي المحدد</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="مثال: صب أعمدة الدور الثامن"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>
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
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
            >
              {loading ? 'جاري الاعتماد...' : 'اعتماد الصرف وتحميل تكلفة البرج'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
