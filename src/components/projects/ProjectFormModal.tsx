import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Project, ProjectStatus, ProjectType } from '../../types';
import { useToast } from '../../context/ToastContext';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => Promise<void>;
  projectToEdit?: Project | null;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  projectToEdit,
}) => {
  const { error } = useToast();
  const [loading, setLoading] = useState(false);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [location, setLocation] = useState('');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('residential');
  const [startDate, setStartDate] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [actualEndDate, setActualEndDate] = useState('');
  const [projectManagerName, setProjectManagerName] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState<number | string>('');
  const [completionRate, setCompletionRate] = useState<number>(0);
  const [status, setStatus] = useState<ProjectStatus>('planned');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (projectToEdit) {
      setCode(projectToEdit.code);
      setName(projectToEdit.name);
      setOwnerName(projectToEdit.owner_name);
      setLocation(projectToEdit.location);
      setDetailedAddress(projectToEdit.detailed_address || '');
      setProjectType(projectToEdit.project_type);
      setStartDate(projectToEdit.start_date);
      setExpectedEndDate(projectToEdit.expected_end_date);
      setActualEndDate(projectToEdit.actual_end_date || '');
      setProjectManagerName(projectToEdit.project_manager_name || '');
      setEstimatedBudget(projectToEdit.estimated_budget);
      setCompletionRate(projectToEdit.completion_rate);
      setStatus(projectToEdit.status);
      setDescription(projectToEdit.description || '');
      setNotes(projectToEdit.notes || '');
    } else {
      // Default initial state
      const randomCode = 'PRJ-' + Math.floor(100 + Math.random() * 900);
      setCode(randomCode);
      setName('');
      setOwnerName('');
      setLocation('القاهرة الجديدة');
      setDetailedAddress('');
      setProjectType('residential');
      setStartDate(new Date().toISOString().split('T')[0]);
      setExpectedEndDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setActualEndDate('');
      setProjectManagerName('');
      setEstimatedBudget(50000000);
      setCompletionRate(0);
      setStatus('planned');
      setDescription('');
      setNotes('');
    }
  }, [projectToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim() || !name.trim() || !ownerName.trim() || !location.trim() || !startDate || !expectedEndDate) {
      error('يرجى استكمال جميع الحقول الأساسية المطلوبة.');
      return;
    }

    if (completionRate < 0 || completionRate > 100) {
      error('نسبة الإنجاز يجب أن تكون بين 0% و 100%.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        owner_name: ownerName.trim(),
        location: location.trim(),
        detailed_address: detailedAddress.trim(),
        project_type: projectType,
        start_date: startDate,
        expected_end_date: expectedEndDate,
        actual_end_date: actualEndDate || null,
        project_manager_name: projectManagerName.trim(),
        estimated_budget: Number(estimatedBudget) || 0,
        completion_rate: Number(completionRate) || 0,
        status,
        description: description.trim(),
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      // Error handled in parent/toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={projectToEdit ? `تعديل المشروع: ${projectToEdit.name}` : 'إضافة مشروع عقاري جديد'}
      subtitle="أدخل بيانات المشروع الإنشائي بالكامل مع التحقق من الكود والميزانية"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
        {/* Row 1: Code and Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project-code-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              كود المشروع (فريد) <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-code-input"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="مثال: PRJ-NC-001"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              dir="ltr"
            />
          </div>

          <div>
            <label htmlFor="project-name-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المشروع <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: كمبوند جوهرة التجمع"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Row 2: Owner, Type, Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="project-owner-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              اسم المالك / الجهة المالكة <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-owner-input"
              type="text"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="اسم شركة المالك أو المستثمر"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-type-select" className="block text-xs font-bold text-slate-700 mb-1.5">
              نوع المشروع <span className="text-rose-500">*</span>
            </label>
            <select
              id="project-type-select"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as ProjectType)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="residential">سكني</option>
              <option value="commercial">تجاري</option>
              <option value="administrative">إداري</option>
              <option value="mixed">مختلط (سكني وتجاري)</option>
              <option value="other">أخرى</option>
            </select>
          </div>

          <div>
            <label htmlFor="project-location-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              المدينة / الموقع <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-location-input"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="مثال: القاهرة الجديدة، العاصمة الإدارية"
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Detailed Address */}
        <div>
          <label htmlFor="project-address-input" className="block text-xs font-bold text-slate-700 mb-1.5">
            العنوان التفصيلي وموقع الأرض
          </label>
          <input
            id="project-address-input"
            type="text"
            value={detailedAddress}
            onChange={(e) => setDetailedAddress(e.target.value)}
            placeholder="الحي، المجاورة، رقم القطعة، المحاور الرئيسية القريبة"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Row 3: Manager, Budget, Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="project-manager-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              مدير المشروع
            </label>
            <input
              id="project-manager-input"
              type="text"
              value={projectManagerName}
              onChange={(e) => setProjectManagerName(e.target.value)}
              placeholder="المهندس المشرف على الموقع"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-budget-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              الميزانية التقديرية (بالجنيه المصري EGP)
            </label>
            <input
              id="project-budget-input"
              type="number"
              min="0"
              step="1000"
              value={estimatedBudget}
              onChange={(e) => setEstimatedBudget(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-status-select" className="block text-xs font-bold text-slate-700 mb-1.5">
              حالة المشروع <span className="text-rose-500">*</span>
            </label>
            <select
              id="project-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="planned">مخطط</option>
              <option value="in_progress">تحت التنفيذ</option>
              <option value="paused">متوقف</option>
              <option value="completed">منتهي ومسلّم</option>
            </select>
          </div>
        </div>

        {/* Row 4: Dates & Progress */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="project-start-date" className="block text-xs font-bold text-slate-700 mb-1.5">
              تاريخ البداية <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-expected-end-date" className="block text-xs font-bold text-slate-700 mb-1.5">
              تاريخ الانتهاء المتوقع <span className="text-rose-500">*</span>
            </label>
            <input
              id="project-expected-end-date"
              type="date"
              value={expectedEndDate}
              onChange={(e) => setExpectedEndDate(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-completion-rate" className="block text-xs font-bold text-slate-700 mb-1.5">
              نسبة الإنجاز ({completionRate}%)
            </label>
            <div className="flex items-center gap-3 pt-2">
              <input
                id="project-completion-rate"
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
        </div>

        {/* Description & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project-description-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              وصف المشروع
            </label>
            <textarea
              id="project-description-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="نطاق الأعمال، الخدمات، المرافق، مواصفات التشطيب..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="project-notes-input" className="block text-xs font-bold text-slate-700 mb-1.5">
              ملاحظات هندسية وإدارية
            </label>
            <textarea
              id="project-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات الاستشاري، حالة التراخيص، قرارات التخصيص..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            id="project-form-cancel-btn"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            إلغاء
          </button>
          <button
            type="submit"
            id="project-form-submit-btn"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
          >
            {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <span>{projectToEdit ? 'حفظ التعديلات' : 'إضافة المشروع'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
