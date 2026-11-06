import React from 'react';
import { FolderKanban, Plus } from 'lucide-react';

interface EmptyStateProps {
  id?: string;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  id,
  title,
  description,
  actionText,
  onAction,
  icon,
}) => {
  return (
    <div
      id={id}
      className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto my-8"
      dir="rtl"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 shadow-sm">
        {icon || <FolderKanban className="w-8 h-8" />}
      </div>
      <h3 className="text-base font-bold text-slate-800">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-sm">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          type="button"
          id={id ? `${id}-action-btn` : 'empty-state-action-btn'}
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-sm transition-all hover:shadow"
        >
          <Plus className="w-4 h-4" />
          {actionText}
        </button>
      )}
    </div>
  );
};
