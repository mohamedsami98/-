import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Tower, TowerStatus, TowerType, Project } from '../../types';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../lib/supabase';

interface TowerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (towerData: any) => Promise<void>;
  towerToEdit?: Tower | null;
  defaultProjectId?: string;
}

export const TowerFormModal: React.FC<TowerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  towerToEdit,
  defaultProjectId,
}) => {
  const { error } = useToast();
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [floorsCount, setFloorsCount] = useState<number | string>(12);
  const [plannedUnitsCount, setPlannedUnitsCount] = useState<number | string>(48);
  const [towerType, setTowerType] = useState<TowerType>('residential');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [status, setStatus] = useState<TowerStatus>('planned');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const list = await dataService.getProjects();
        setProjects(list);
        if (!projectId && list.length > 0) {
          setProjectId(defaultProjectId || list[0].id);
        }
      } catch (e) {
        console.error('Failed to load projects list for tower form', e);
      }
    };
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen, defaultProjectId]);

  useEffect(() => {
    if (towerToEdit) {
      setProjectId(towerToEdit.project_id);
      setCode(towerToEdit.code);
      setName(towerToEdit.name);
      setFloorsCount(towerToEdit.floors_count);
      setPlannedUnitsCount(towerToEdit.planned_units_count);
      setTowerType(towerToEdit.tower_type);
      setStartDate(towerToEdit.start_date);
      setExpectedEndDate(towerToEdit.expected_end_date);
      setCompletionRate(towerToEdit.completion_rate);
      setStatus(towerToEdit.status);
      setNotes(towerToEdit.notes || '');
    } else {
      const randCode = 'TOW-' + Math.floor(10 + Math.random() * 90);
      setCode(randCode);
      setName('');
      if (defaultProjectId) setProjectId(defaultProjectId);
      setFloorsCount(14);
      setPlannedUnitsCount(56);
      setTowerType('residential');
      setStartDate(new Date().toISOString().split('T')[0]);
      setExpectedEndDate(new Date(Date.now() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setCompletionRate(0);
      setStatus('planned');
      setNotes('');
    }
  }, [towerToEdit, isOpen, defaultProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId) {
      error('لا يمكن إنشاء برج بدون تحديد المشروع التابع له.');
      return;
    }

    if (!code.trim() || !name.trim() || !startDate || !expectedEndDate) {
      error('يرجى ملء كافة الحقول الإلزامية.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        project_id: projectId,
        code: code.trim().toUpperCase(),
        name: name.trim(),
        floors_count: Math.max(1, Number(floorsCount) || 1),
        planned_units_count: Math.max(0, Number(plannedUnitsCount) || 0),
        tower_type: towerType,
        start_date: startDate,
        expected_end_date: expectedEndDate,
        completion_rate: Number(completionRate) || 0,
        status,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      // Handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={towerToEdit ? `تعديل البرج: ${towerToEdit.name}` : 'إضافة برج إنشائي جديد'}
      subtitle="ربط البرج بالمشروع وتحديد عدد الأدوار والوحدات والمخطط الزمني"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
        {/* Project Linkage (Mandatory) */}
        <div>
          <label htmlFor="tower-project-select" className="block text-xs font-bold text-slate-700 mb-1.5">
            المشروع التابع له البرج <span className="text-rose-500">*</span>
          </label>
          <select
            id="tower-project-select"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="" disabled>-- اختر المشروع --</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-slate-400">
            * لا يمكن إنشاء برج دون ربطه بمشروع تطوير عقاري معتمد
          </p>
        </div>

        {/* Row 1: Code and Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="tower-code-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              كود البرج <span className="text-rose-500">*</span>
            </label>
            <input
              id="tower-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثال: TOW-01"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="tower-name-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم البرج أو المبنى <span className="text-rose-500">*</span>
            </label>
            <input
              id="tower-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: برج الياقوت A"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Type, Floors, Planned Units */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="tower-type-select" className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع البرج <span className="text-rose-500">*</span>
            </label>
            <select
              id="tower-type-select"
              value={towerType}
              onChange={(e) => setTowerType(e.target.value as TowerType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="residential">سكني</option>
              <option value="commercial">تجاري</option>
              <option value="administrative">إداري</option>
              <option value="mixed">مختلط</option>
            </select>
          </div>

          <div>
            <label htmlFor="tower-floors-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              عدد الأدوار <span className="text-rose-500">*</span>
            </label>
            <input
              id="tower-floors-input"
              type="number"
              min="1"
              max="150"
              value={floorsCount}
              onChange={(e) => setFloorsCount(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="tower-units-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              عدد الوحدات المخططة
            </label>
            <input
              id="tower-units-input"
              type="number"
              min="0"
              value={plannedUnitsCount}
              onChange={(e) => setPlannedUnitsCount(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 3: Dates & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="tower-start-date" className="block text-xs font-bold text-slate-700 mb-1.5">
              تاريخ بدء التنفيذ <span className="text-rose-500">*</span>
            </label>
            <input
              id="tower-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="tower-end-date" className="block text-xs font-bold text-slate-700 mb-1.5">
              تاريخ الانتهاء المتوقع <span className="text-rose-500">*</span>
            </label>
            <input
              id="tower-end-date"
              type="date"
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="tower-status-select" className="block text-xs font-bold text-slate-700 mb-1.5">
              الحالة <span className="text-rose-500">*</span>
            </label>
            <select
              id="tower-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TowerStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="planned">مخطط</option>
              <option value="in_progress">تحت التنفيذ</option>
              <option value="paused">متوقف</option>
              <option value="completed">منتهي ومسلّم</option>
            </select>
          </div>
        </div>

        {/* Completion rate slider */}
        <div>
          <label htmlFor="tower-completion-slider" className="block text-xs font-bold text-slate-700 mb-1.5">
            نسبة الإنجاز الإنشائي ({completionRate}%)
          </label>
          <div className="flex items-center gap-3">
            <input
              id="tower-completion-slider"
              type="range"
              min="0"
              max="100"
              value={completionRate}
              onChange={(e) => setCompletionRate(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <span className="text-xs font-bold px-2 py-1 bg-blue-50 text-blue-700 rounded-md min-w-[45px] text-center">
              {completionRate}%
            </span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="tower-notes-input" className="block text-xs font-bold text-slate-700 mb-1.5">
            ملاحظات وتفاصيل الأعمال
          </label>
          <textarea
            id="tower-notes-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مراحل الصب، أعمال الواجهات، حالة المصاعد..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            id="tower-form-cancel-btn"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            id="tower-form-submit-btn"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{towerToEdit ? 'حفظ تعديلات البرج' : 'إضافة البرج'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
