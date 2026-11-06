import React from 'react';
import { ProjectStatus, ProjectType, TowerStatus, TowerType, UserStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'cyan';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  switch (variant) {
    case 'primary':
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'success':
      colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      break;
    case 'warning':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      break;
    case 'danger':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      break;
    case 'info':
      colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
      break;
    case 'purple':
      colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
      break;
    case 'cyan':
      colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
      break;
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border font-semibold whitespace-nowrap ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
};

export const ProjectStatusBadge: React.FC<{ status: ProjectStatus }> = ({ status }) => {
  switch (status) {
    case 'in_progress':
      return <Badge variant="primary">تحت التنفيذ</Badge>;
    case 'completed':
      return <Badge variant="success">منتهي</Badge>;
    case 'planned':
      return <Badge variant="warning">مخطط</Badge>;
    case 'paused':
      return <Badge variant="danger">متوقف</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const TowerStatusBadge: React.FC<{ status: TowerStatus }> = ({ status }) => {
  switch (status) {
    case 'in_progress':
      return <Badge variant="primary">تحت التنفيذ</Badge>;
    case 'completed':
      return <Badge variant="success">منتهي</Badge>;
    case 'planned':
      return <Badge variant="warning">مخطط</Badge>;
    case 'paused':
      return <Badge variant="danger">متوقف</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

export const ProjectTypeBadge: React.FC<{ type: ProjectType }> = ({ type }) => {
  switch (type) {
    case 'residential':
      return <Badge variant="info">سكني</Badge>;
    case 'commercial':
      return <Badge variant="purple">تجاري</Badge>;
    case 'administrative':
      return <Badge variant="cyan">إداري</Badge>;
    case 'mixed':
      return <Badge variant="warning">مختلط</Badge>;
    case 'other':
      return <Badge variant="default">أخرى</Badge>;
    default:
      return <Badge>{type}</Badge>;
  }
};

export const TowerTypeBadge: React.FC<{ type: TowerType }> = ({ type }) => {
  switch (type) {
    case 'residential':
      return <Badge variant="info">سكني</Badge>;
    case 'commercial':
      return <Badge variant="purple">تجاري</Badge>;
    case 'administrative':
      return <Badge variant="cyan">إداري</Badge>;
    case 'mixed':
      return <Badge variant="warning">مختلط</Badge>;
    default:
      return <Badge>{type}</Badge>;
  }
};

export const UserStatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  if (status === 'active') {
    return <Badge variant="success">نشط</Badge>;
  }
  return <Badge variant="danger">غير نشط</Badge>;
};

export const UserRoleBadge: React.FC<{ roleName: string }> = ({ roleName }) => {
  if (roleName.includes('مدير النظام')) {
    return <Badge variant="danger">{roleName}</Badge>;
  }
  if (roleName.includes('مدير الشركة')) {
    return <Badge variant="primary">{roleName}</Badge>;
  }
  if (roleName.includes('مدير المشروع')) {
    return <Badge variant="warning">{roleName}</Badge>;
  }
  if (roleName.includes('المحاسب')) {
    return <Badge variant="purple">{roleName}</Badge>;
  }
  if (roleName.includes('مهندس الموقع')) {
    return <Badge variant="cyan">{roleName}</Badge>;
  }
  return <Badge variant="info">{roleName}</Badge>;
};

