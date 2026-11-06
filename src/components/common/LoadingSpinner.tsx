import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'جاري تحميل البيانات من الخادم...', 
  size = 'md' 
}) => {
  const sizeClasses = size === 'sm' ? 'w-5 h-5 border-2' : size === 'lg' ? 'w-12 h-12 border-4' : 'w-8 h-8 border-3';

  return (
    <div className="flex flex-col items-center justify-center p-12 gap-3" dir="rtl">
      <div className={`${sizeClasses} border-blue-600 border-t-transparent rounded-full animate-spin`} />
      {message && (
        <span className="text-sm font-medium text-slate-500 animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};
