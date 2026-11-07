import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { 
  Project, 
  Tower, 
  UserProfile, 
  Role, 
  Permission, 
  ActivityLog, 
  CompanySettings,
  SystemModule,
  PermissionAction
} from '../types';
import { initializeFinancialStorage } from './financialService';

// Storage keys
const LOCAL_STORAGE_KEY_PREFIX = 'egypt_contracting_';
const CONFIG_STORAGE_KEY = `${LOCAL_STORAGE_KEY_PREFIX}supabase_config`;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

// Check environment variables first, then user-configured keys
export const getSupabaseConfig = (): SupabaseConfig => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return { url: envUrl, anonKey: envKey };
  }

  try {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading saved Supabase configuration', e);
  }

  return { url: '', anonKey: '' };
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  if (!config.url || !config.anonKey) {
    localStorage.removeItem(CONFIG_STORAGE_KEY);
  } else {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  }
};

let supabaseInstance: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getSupabaseConfig();
  if (config.url && config.anonKey) {
    try {
      if (!supabaseInstance) {
        supabaseInstance = createClient(config.url, config.anonKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          }
        });
      }
      return supabaseInstance;
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return null;
};

export const isSupabaseConfigured = (): boolean => {
  const config = getSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('https://'));
};

// ============================================================================
// INITIAL SEED DATA FOR ROLES & PERMISSIONS
// ============================================================================

export const DEFAULT_ROLES: Role[] = [
  {
    id: 'role-system-admin',
    name: 'مدير النظام',
    key: 'system_admin',
    description: 'كامل الصلاحيات والتحكم في النظام والمستخدمين والإعدادات',
    is_system: true,
  },
  {
    id: 'role-company-manager',
    name: 'مدير الشركة',
    key: 'company_manager',
    description: 'صلاحيات الإشراف العام والمتابعة والاعتمادات والتقارير',
    is_system: false,
  },
  {
    id: 'role-project-manager',
    name: 'مدير المشروع',
    key: 'project_manager',
    description: 'إدارة المشروعات والأبراج ومتابعة نسب الإنجاز',
    is_system: false,
  },
  {
    id: 'role-accountant',
    name: 'المحاسب',
    key: 'accountant',
    description: 'صلاحيات المالية والميزانيات والتقارير',
    is_system: false,
  },
  {
    id: 'role-procurement',
    name: 'مسؤول المشتريات',
    key: 'procurement_officer',
    description: 'صلاحيات طلبات الشراء والمناقصات والموردين مستقبلاً',
    is_system: false,
  },
  {
    id: 'role-storekeeper',
    name: 'أمين المخزن',
    key: 'storekeeper',
    description: 'صلاحيات حركة المواد والتوريدات المخزنية مستقبلاً',
    is_system: false,
  },
  {
    id: 'role-sales',
    name: 'موظف المبيعات',
    key: 'sales_officer',
    description: 'عرض المشروعات وتفاصيل الأبراج والوحدات',
    is_system: false,
  },
  {
    id: 'role-collector',
    name: 'موظف التحصيل',
    key: 'collection_officer',
    description: 'صلاحيات التحصيل والمتابعة المالية مستقبلاً',
    is_system: false,
  },
];

const MODULE_NAMES: Record<SystemModule, string> = {
  dashboard: 'لوحة التحكم',
  projects: 'المشروعات',
  towers: 'الأبراج',
  costs: 'التكاليف والمصروفات',
  inventory: 'المخازن والمواد الخام',
  installments: 'تحصيل الأقساط والشيكات',
  banking: 'الحسابات البنكية والخزائن',
  users: 'المستخدمون',
  roles_permissions: 'الأدوار والصلاحيات',
  activity_logs: 'سجل النشاط',
  settings: 'الإعدادات',
  reports: 'تقارير الأقساط والتحصيل',
  suppliers: 'الموردين ومقاولو الباطن',
  partners: 'الشركاء والأرباح الرأسمالية',
};

const ACTION_NAMES: Record<PermissionAction, string> = {
  view: 'مشاهدة',
  create: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  approve: 'اعتماد',
  print: 'طباعة',
  export: 'تصدير',
};

export const generateAllPermissions = (): Permission[] => {
  const permissions: Permission[] = [];
  const modules: SystemModule[] = [
    'dashboard',
    'projects',
    'towers',
    'costs',
    'inventory',
    'installments',
    'banking',
    'users',
    'roles_permissions',
    'activity_logs',
    'settings',
    'reports',
    'suppliers',
    'partners',
  ];
  const actions: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'print', 'export'];

  modules.forEach((mod) => {
    actions.forEach((act) => {
      permissions.push({
        id: `perm-${mod}-${act}`,
        module: mod,
        module_ar: MODULE_NAMES[mod],
        action: act,
        action_ar: ACTION_NAMES[act],
        code: `${mod}:${act}`,
        description: `صلاحية ${ACTION_NAMES[act]} في قسم ${MODULE_NAMES[mod]}`,
      });
    });
  });

  return permissions;
};

export const ALL_PERMISSIONS = generateAllPermissions();

// Default permissions map per role key
export const DEFAULT_ROLE_PERMISSION_CODES: Record<string, string[]> = {
  system_admin: ALL_PERMISSIONS.map((p) => p.code), // Everything
  company_manager: [
    'dashboard:view', 'dashboard:export', 'dashboard:print',
    'projects:view', 'projects:create', 'projects:edit', 'projects:approve', 'projects:print', 'projects:export',
    'towers:view', 'towers:create', 'towers:edit', 'towers:approve', 'towers:print', 'towers:export',
    'costs:view', 'costs:create', 'costs:edit', 'costs:approve', 'costs:print', 'costs:export',
    'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:approve', 'inventory:print', 'inventory:export',
    'installments:view', 'installments:create', 'installments:edit', 'installments:approve', 'installments:print', 'installments:export',
    'banking:view', 'banking:create', 'banking:edit', 'banking:approve', 'banking:print', 'banking:export',
    'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:approve', 'suppliers:print', 'suppliers:export',
    'partners:view', 'partners:create', 'partners:edit', 'partners:approve', 'partners:print', 'partners:export',
    'users:view', 'roles_permissions:view', 'activity_logs:view', 'activity_logs:export',
    'settings:view',
    'reports:view', 'reports:print', 'reports:export'
  ],
  project_manager: [
    'dashboard:view',
    'projects:view', 'projects:create', 'projects:edit', 'projects:print', 'projects:export',
    'towers:view', 'towers:create', 'towers:edit', 'towers:print', 'towers:export',
    'costs:view', 'costs:create', 'costs:print', 'costs:export',
    'inventory:view', 'inventory:create', 'inventory:print',
    'suppliers:view',
    'partners:view',
    'activity_logs:view',
    'reports:view', 'reports:print', 'reports:export'
  ],
  accountant: [
    'dashboard:view',
    'projects:view', 'projects:export', 'projects:print',
    'towers:view', 'towers:export',
    'costs:view', 'costs:create', 'costs:edit', 'costs:delete', 'costs:approve', 'costs:print', 'costs:export',
    'inventory:view', 'inventory:export', 'inventory:print',
    'installments:view', 'installments:create', 'installments:edit', 'installments:approve', 'installments:print', 'installments:export',
    'banking:view', 'banking:create', 'banking:edit', 'banking:approve', 'banking:print', 'banking:export',
    'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:delete', 'suppliers:approve', 'suppliers:print', 'suppliers:export',
    'partners:view', 'partners:create', 'partners:edit', 'partners:approve', 'partners:print', 'partners:export',
    'activity_logs:view',
    'reports:view', 'reports:print', 'reports:export'
  ],
  procurement_officer: [
    'dashboard:view',
    'projects:view',
    'towers:view',
    'costs:view', 'costs:create',
    'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:print', 'inventory:export',
    'suppliers:view', 'suppliers:create', 'suppliers:edit', 'suppliers:print', 'suppliers:export'
  ],
  storekeeper: [
    'dashboard:view',
    'projects:view',
    'towers:view',
    'inventory:view', 'inventory:create', 'inventory:edit', 'inventory:approve', 'inventory:print', 'inventory:export'
  ],
  sales_officer: [
    'dashboard:view',
    'projects:view', 'projects:print', 'projects:export',
    'towers:view', 'towers:print', 'towers:export',
    'installments:view', 'installments:print', 'installments:export',
    'reports:view', 'reports:print', 'reports:export'
  ],
  collection_officer: [
    'dashboard:view',
    'projects:view',
    'towers:view',
    'installments:view', 'installments:create', 'installments:edit', 'installments:approve', 'installments:print', 'installments:export',
    'banking:view',
    'reports:view', 'reports:print', 'reports:export'
  ],
};

export const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
  id: 'company-settings-default',
  company_name: 'شركة النخبة للمقاولات والتطوير العقاري',
  system_name: 'نظام إدارة شركة المقاولات والتطوير العقاري',
  phone: '01023456789',
  email: 'contact@el-nokhba.com.eg',
  address: 'القاهرة الجديدة، التجمع الخامس، شارع التسعين الشمالي، جمهورية مصر العربية',
  tax_number: '456-789-123',
  commercial_registry: '102938',
  default_currency: 'EGP',
  logo_url: '',
  updated_at: new Date().toISOString(),
};

// Initial Seed Users
export const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    full_name: 'المهندس أحمد محمد الشرقاوي',
    email: 'admin@company.com',
    phone: '01011223344',
    role_id: 'role-system-admin',
    role_name: 'مدير النظام',
    role_key: 'system_admin',
    status: 'active',
    created_at: '2025-01-10T08:00:00.000Z',
    last_sign_in_at: new Date().toISOString(),
  },
  {
    id: 'user-manager-2',
    full_name: 'الدكتور طارق عبد العزيز',
    email: 'manager@company.com',
    phone: '01122334455',
    role_id: 'role-company-manager',
    role_name: 'مدير الشركة',
    role_key: 'company_manager',
    status: 'active',
    created_at: '2025-01-15T09:30:00.000Z',
    last_sign_in_at: '2025-02-18T10:15:00.000Z',
  },
  {
    id: 'user-pm-3',
    full_name: 'المهندس حسام الدين ممدوح',
    email: 'pm@company.com',
    phone: '01233445566',
    role_id: 'role-project-manager',
    role_name: 'مدير المشروع',
    role_key: 'project_manager',
    status: 'active',
    created_at: '2025-02-01T11:00:00.000Z',
    last_sign_in_at: '2025-02-20T14:20:00.000Z',
  },
  {
    id: 'user-accountant-4',
    full_name: 'الأستاذ محمود إبراهيم',
    email: 'accountant@company.com',
    phone: '01044556677',
    role_id: 'role-accountant',
    role_name: 'المحاسب',
    role_key: 'accountant',
    status: 'active',
    created_at: '2025-02-05T09:00:00.000Z',
    last_sign_in_at: '2025-02-19T16:00:00.000Z',
  },
];

// Initial Real Estate Projects in Egypt
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    code: 'PRJ-NC-001',
    name: 'كمبوند جوهرة التجمع السكني',
    owner_name: 'شركة النخبة للتطوير العقاري',
    location: 'القاهرة الجديدة - التجمع الخامس',
    detailed_address: 'منطقة بيت الوطن، الحي الرابع، قطعة 12، القاهرة الجديدة',
    project_type: 'residential',
    start_date: '2024-03-01',
    expected_end_date: '2026-12-31',
    actual_end_date: null,
    project_manager_name: 'المهندس حسام الدين ممدوح',
    estimated_budget: 450000000,
    completion_rate: 65,
    status: 'in_progress',
    description: 'مشروع مجمع سكني فاخر يضم 4 أبراج سكنية متكاملة الخدمات مع مسطحات خضراء ومنطقة ترفيهية.',
    notes: 'تم الانتهاء من أعمال الخرسانات المسلحة لثلاثة أبراج وبدء التشطيبات الخارجية.',
    created_at: '2024-03-01T10:00:00.000Z',
    updated_at: '2025-02-15T12:30:00.000Z',
  },
  {
    id: 'proj-002',
    code: 'PRJ-NAC-002',
    name: 'برج العاصمة الإدارية للأعمال',
    owner_name: 'الهيئة المصرية للاستثمار العقاري',
    location: 'العاصمة الإدارية الجديدة - منطقة CBD',
    detailed_address: 'منطقة الأعمال المركزية، القطاع التجاري الغربي، العاصمة الإدارية',
    project_type: 'commercial',
    start_date: '2024-01-15',
    expected_end_date: '2027-06-30',
    actual_end_date: null,
    project_manager_name: 'المهندس كريم الشناوي',
    estimated_budget: 820000000,
    completion_rate: 42,
    status: 'in_progress',
    description: 'برج تجاري وإداري استثماري عملاق مجهز بأحدث أنظمة المباني الذكية وصديقة للبيئة.',
    notes: 'العمل يسير وفق الجدول الزمني المحدد مع استشاري المشروع.',
    created_at: '2024-01-15T09:00:00.000Z',
    updated_at: '2025-02-18T15:00:00.000Z',
  },
  {
    id: 'proj-003',
    code: 'PRJ-ZAYED-003',
    name: 'مجمع واحة زايد الطبي والإداري',
    owner_name: 'مجموعة النماء الطبية',
    location: 'الجيزة - الشيخ زايد',
    detailed_address: 'مدخل زايد 2، محور الكفراوي، مدينة الشيخ زايد، محافظة الجيزة',
    project_type: 'administrative',
    start_date: '2023-06-01',
    expected_end_date: '2025-04-30',
    actual_end_date: null,
    project_manager_name: 'المهندسة سارة الباجوري',
    estimated_budget: 280000000,
    completion_rate: 92,
    status: 'in_progress',
    description: 'مجمع عيادات ومكاتب إدارية راقية ومختبرات طبية ومركز أشعة متطور.',
    notes: 'في مرحلة الفحص النهائي واستخراج شهادات المطابقة والسلامة.',
    created_at: '2023-06-01T08:00:00.000Z',
    updated_at: '2025-02-10T11:20:00.000Z',
  },
  {
    id: 'proj-004',
    code: 'PRJ-ALEX-004',
    name: 'مشروع لؤلؤة البحرين الترفيهي السكني',
    owner_name: 'شركة الساحل للتطوير',
    location: 'الإسكندرية - سيدي عبد الرحمن',
    detailed_address: 'طريق الإسكندرية مطروح، الكيلو 134، سيدي عبد الرحمن',
    project_type: 'mixed',
    start_date: '2025-05-01',
    expected_end_date: '2028-08-31',
    actual_end_date: null,
    project_manager_name: 'المهندس عمر خيري',
    estimated_budget: 650000000,
    completion_rate: 10,
    status: 'planned',
    description: 'مشروع سياحي وسكني متكامل مع شواطئ خاصة ومراسي يخوت وممشى سياحي عالمي.',
    notes: 'تم اعتماد المخطط الهندسي العام وجارِ الانتهاء من التراخيص الإنشائية.',
    created_at: '2025-01-20T14:00:00.000Z',
    updated_at: '2025-02-01T09:10:00.000Z',
  },
  {
    id: 'proj-005',
    code: 'PRJ-MAADI-005',
    name: 'أبراج كورنيش المعادي السكنية',
    owner_name: 'مؤسسة المعادي العقارية',
    location: 'القاهرة - كورنيش المعادي',
    detailed_address: 'كورنيش النيل، المعادي، بجوار مستشفى النيل، القاهرة',
    project_type: 'residential',
    start_date: '2022-02-01',
    expected_end_date: '2024-11-30',
    actual_end_date: '2024-11-20',
    project_manager_name: 'المهندس أحمد محمد الشرقاوي',
    estimated_budget: 390000000,
    completion_rate: 100,
    status: 'completed',
    description: 'مجموعة أبراج سكنية مطلة مباشرة على النيل تم تسليمها بنجاح للعملاء.',
    notes: 'تم التسليم بالكامل وتسليم اتحاد الشاغلين.',
    created_at: '2022-02-01T10:00:00.000Z',
    updated_at: '2024-11-25T16:00:00.000Z',
  }
];

export const INITIAL_TOWERS: Tower[] = [
  {
    id: 'tow-001',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    code: 'TOW-NC-A',
    name: 'برج الياقوت A',
    floors_count: 14,
    planned_units_count: 56,
    tower_type: 'residential',
    start_date: '2024-03-15',
    expected_end_date: '2026-08-30',
    completion_rate: 75,
    status: 'in_progress',
    notes: 'تم صب السقف الأخير وجارِ أعمال المحارة والسباكة والكهرباء.',
    created_at: '2024-03-15T10:00:00.000Z',
    updated_at: '2025-02-14T11:00:00.000Z',
  },
  {
    id: 'tow-002',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    code: 'TOW-NC-B',
    name: 'برج الزمرد B',
    floors_count: 14,
    planned_units_count: 56,
    tower_type: 'residential',
    start_date: '2024-04-01',
    expected_end_date: '2026-10-30',
    completion_rate: 60,
    status: 'in_progress',
    notes: 'أعمال البناء بالطابق التاسع جارية حالياً.',
    created_at: '2024-04-01T11:00:00.000Z',
    updated_at: '2025-02-10T14:30:00.000Z',
  },
  {
    id: 'tow-003',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    code: 'TOW-NC-C',
    name: 'برج المرجان C',
    floors_count: 12,
    planned_units_count: 48,
    tower_type: 'residential',
    start_date: '2024-06-01',
    expected_end_date: '2026-12-15',
    completion_rate: 55,
    status: 'in_progress',
    notes: 'أعمال الهيكل الخرساني متقدمة بنسبة 80%.',
    created_at: '2024-06-01T09:00:00.000Z',
    updated_at: '2025-02-12T09:00:00.000Z',
  },
  {
    id: 'tow-004',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    code: 'TOW-NAC-MAIN',
    name: 'البرج الإداري الرئيسي - العاصمة',
    floors_count: 32,
    planned_units_count: 180,
    tower_type: 'commercial',
    start_date: '2024-02-01',
    expected_end_date: '2027-06-30',
    completion_rate: 42,
    status: 'in_progress',
    notes: 'تم الانتهاء من أعمال الأساسات العميقة وجارِ صب الأدوار الأرضية والميزانين.',
    created_at: '2024-02-01T10:00:00.000Z',
    updated_at: '2025-02-18T10:00:00.000Z',
  },
  {
    id: 'tow-005',
    project_id: 'proj-003',
    project_name: 'مجمع واحة زايد الطبي والإداري',
    code: 'TOW-ZYD-CLINIC',
    name: 'مبنى العيادات التخصصية',
    floors_count: 7,
    planned_units_count: 42,
    tower_type: 'administrative',
    start_date: '2023-06-15',
    expected_end_date: '2025-04-30',
    completion_rate: 92,
    status: 'in_progress',
    notes: 'أعمال التشطيب الفاخر وتركيب المصاعد الطبية مستمرة.',
    created_at: '2023-06-15T09:00:00.000Z',
    updated_at: '2025-02-16T12:00:00.000Z',
  },
  {
    id: 'tow-006',
    project_id: 'proj-005',
    project_name: 'أبراج كورنيش المعادي السكنية',
    code: 'TOW-MAADI-NIL',
    name: 'برج النيل البانورامي',
    floors_count: 22,
    planned_units_count: 88,
    tower_type: 'residential',
    start_date: '2022-02-15',
    expected_end_date: '2024-11-20',
    completion_rate: 100,
    status: 'completed',
    notes: 'تم اكتمال المشروع وتسليم الوحدات لجميع المشترين.',
    created_at: '2022-02-15T09:00:00.000Z',
    updated_at: '2024-11-20T17:00:00.000Z',
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'log-001',
    user_id: 'user-admin-1',
    user_name: 'المهندس أحمد محمد الشرقاوي',
    action_type: 'create',
    module: 'projects',
    record_id: 'PRJ-NC-001',
    description: 'قام المهندس أحمد محمد الشرقاوي بإضافة مشروع كمبوند جوهرة التجمع السكني.',
    created_at: '2025-02-18T14:32:00.000Z',
  },
  {
    id: 'log-002',
    user_id: 'user-pm-3',
    user_name: 'المهندس حسام الدين ممدوح',
    action_type: 'create',
    module: 'towers',
    record_id: 'TOW-NC-A',
    description: 'قام المهندس حسام الدين ممدوح بإضافة برج الياقوت A وربطه بمشروع كمبوند جوهرة التجمع.',
    created_at: '2025-02-18T15:10:00.000Z',
  },
  {
    id: 'log-003',
    user_id: 'user-manager-2',
    user_name: 'الدكتور طارق عبد العزيز',
    action_type: 'update',
    module: 'projects',
    record_id: 'PRJ-NAC-002',
    description: 'قام الدكتور طارق عبد العزيز بتحديث نسبة إنجاز برج العاصمة الإدارية إلى 42%.',
    created_at: '2025-02-19T09:45:00.000Z',
  },
  {
    id: 'log-004',
    user_id: 'user-admin-1',
    user_name: 'المهندس أحمد محمد الشرقاوي',
    action_type: 'auth',
    module: 'auth',
    record_id: 'user-admin-1',
    description: 'تم تسجيل الدخول بنجاح بواسطة مدير النظام.',
    created_at: '2025-02-20T08:00:00.000Z',
  }
];

// Local Repository Helpers
const getStorageItem = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : defaultVal;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return defaultVal;
  }
};

const setStorageItem = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${key}`, JSON.stringify(val));
  } catch (e) {
    console.error(`Error saving ${key}`, e);
  }
};

// Initialize repositories if empty
export const initializeLocalStorage = () => {
  const isWipedClean = localStorage.getItem('app_data_wiped_clean') === 'true';

  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}roles`)) {
    setStorageItem('roles', DEFAULT_ROLES);
  }
  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}permissions`)) {
    setStorageItem('permissions', ALL_PERMISSIONS);
  }
  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}role_permissions`)) {
    setStorageItem('role_permissions', DEFAULT_ROLE_PERMISSION_CODES);
  }
  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}users`)) {
    setStorageItem('users', DEFAULT_USERS);
  }
  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}projects`)) {
    setStorageItem('projects', isWipedClean ? [] : INITIAL_PROJECTS);
  }
  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}towers`)) {
    setStorageItem('towers', isWipedClean ? [] : INITIAL_TOWERS);
  }
  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}activity_logs`)) {
    setStorageItem('activity_logs', isWipedClean ? [] : INITIAL_ACTIVITY_LOGS);
  }
  if (!localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}company_settings`)) {
    setStorageItem('company_settings', DEFAULT_COMPANY_SETTINGS);
  }
  initializeFinancialStorage();
};

// ============================================================================
// DATA SERVICE (Transparent: Real Supabase with fallback to local persistent DB)
// ============================================================================

export const dataService = {
  // Activity Logging
  async logActivity(
    user: { id: string; full_name: string },
    action_type: 'create' | 'update' | 'delete' | 'approve' | 'auth',
    module: SystemModule | 'auth',
    description: string,
    record_id?: string
  ): Promise<void> {
    const newLog: ActivityLog = {
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      user_id: user.id,
      user_name: user.full_name,
      action_type,
      module,
      record_id,
      description,
      created_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('activity_logs').insert([
          {
            user_id: user.id,
            user_name: user.full_name,
            action_type,
            module,
            record_id,
            description,
          }
        ]);
        return;
      } catch (err) {
        console.warn('Supabase logActivity fallback to local:', err);
      }
    }

    const currentLogs = getStorageItem<ActivityLog[]>('activity_logs', INITIAL_ACTIVITY_LOGS);
    setStorageItem('activity_logs', [newLog, ...currentLogs]);
  },

  async getActivityLogs(limit = 50): Promise<ActivityLog[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!error && data) return data as ActivityLog[];
      } catch (err) {
        console.warn('Supabase getActivityLogs fallback:', err);
      }
    }
    const logs = getStorageItem<ActivityLog[]>('activity_logs', INITIAL_ACTIVITY_LOGS);
    return logs.slice(0, limit);
  },

  // Company Settings
  async getCompanySettings(): Promise<CompanySettings> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .single();
        if (!error && data) return data as CompanySettings;
      } catch (err) {
        console.warn('Supabase getCompanySettings fallback:', err);
      }
    }
    return getStorageItem<CompanySettings>('company_settings', DEFAULT_COMPANY_SETTINGS);
  },

  async updateCompanySettings(settings: Partial<CompanySettings>, user: { id: string; full_name: string }): Promise<CompanySettings> {
    const updated = {
      ...DEFAULT_COMPANY_SETTINGS,
      ...settings,
      updated_at: new Date().toISOString()
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .upsert([updated])
          .select()
          .single();
        if (!error && data) {
          await this.logActivity(user, 'update', 'settings', 'قام بتحديث إعدادات الشركة وبيانات النظام العامة.');
          return data as CompanySettings;
        }
      } catch (err) {
        console.warn('Supabase updateCompanySettings fallback:', err);
      }
    }

    setStorageItem('company_settings', updated);
    await this.logActivity(user, 'update', 'settings', 'قام بتحديث إعدادات الشركة وبيانات النظام العامة.');
    return updated;
  },

  // Projects CRUD
  async getProjects(): Promise<Project[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*, towers(count)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((p: any) => ({
            ...p,
            towers_count: p.towers?.[0]?.count ?? 0,
          })) as Project[];
        }
      } catch (err) {
        console.warn('Supabase getProjects fallback:', err);
      }
    }

    const projects = getStorageItem<Project[]>('projects', INITIAL_PROJECTS);
    const towers = getStorageItem<Tower[]>('towers', INITIAL_TOWERS);

    return projects.map((p) => {
      const pTowers = towers.filter((t) => t.project_id === p.id);
      return {
        ...p,
        towers_count: pTowers.length,
      };
    });
  },

  async getProjectById(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find((p) => p.id === id) || null;
  },

  async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>, user: { id: string; full_name: string }): Promise<Project> {
    // Check unique code
    const existing = await this.getProjects();
    if (existing.some((p) => p.code.trim().toLowerCase() === project.code.trim().toLowerCase())) {
      throw new Error(`كود المشروع "${project.code}" مستخدم بالفعل، يرجى اختيار كود فريد.`);
    }

    const newProject: Project = {
      ...project,
      id: 'proj-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert([{
            code: project.code,
            name: project.name,
            owner_name: project.owner_name,
            location: project.location,
            detailed_address: project.detailed_address,
            project_type: project.project_type,
            start_date: project.start_date,
            expected_end_date: project.expected_end_date,
            actual_end_date: project.actual_end_date || null,
            project_manager_name: project.project_manager_name,
            estimated_budget: project.estimated_budget,
            completion_rate: project.completion_rate,
            status: project.status,
            description: project.description,
            notes: project.notes,
          }])
          .select()
          .single();
        if (!error && data) {
          await this.logActivity(user, 'create', 'projects', `قام ${user.full_name} بإضافة مشروع ${project.name} (كود: ${project.code}).`, data.id);
          return data as Project;
        }
      } catch (err) {
        console.warn('Supabase createProject fallback:', err);
      }
    }

    const updatedList = [newProject, ...existing];
    setStorageItem('projects', updatedList);
    await this.logActivity(user, 'create', 'projects', `قام ${user.full_name} بإضافة مشروع ${newProject.name} (كود: ${newProject.code}).`, newProject.id);
    return newProject;
  },

  async updateProject(id: string, updates: Partial<Project>, user: { id: string; full_name: string }): Promise<Project> {
    const existing = await this.getProjects();
    const index = existing.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('المشروع غير موجود.');

    // Check code uniqueness if changed
    if (updates.code && updates.code !== existing[index].code) {
      if (existing.some((p) => p.id !== id && p.code.trim().toLowerCase() === updates.code!.trim().toLowerCase())) {
        throw new Error(`كود المشروع "${updates.code}" مستخدم بالفعل لمشروع آخر.`);
      }
    }

    const updated = {
      ...existing[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          await this.logActivity(user, 'update', 'projects', `قام ${user.full_name} بتعديل بيانات مشروع ${updated.name}.`, id);
          return data as Project;
        }
      } catch (err) {
        console.warn('Supabase updateProject fallback:', err);
      }
    }

    existing[index] = updated;
    setStorageItem('projects', existing);
    await this.logActivity(user, 'update', 'projects', `قام ${user.full_name} بتعديل بيانات مشروع ${updated.name}.`, id);
    return updated;
  },

  async deleteProject(id: string, user: { id: string; full_name: string }): Promise<void> {
    const existing = await this.getProjects();
    const proj = existing.find((p) => p.id === id);
    if (!proj) throw new Error('المشروع غير موجود.');

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('projects').delete().eq('id', id);
        await this.logActivity(user, 'delete', 'projects', `قام ${user.full_name} بحذف مشروع ${proj.name} (كود: ${proj.code}).`, id);
        return;
      } catch (err) {
        console.warn('Supabase deleteProject fallback:', err);
      }
    }

    // Cascade delete related towers
    const towers = getStorageItem<Tower[]>('towers', INITIAL_TOWERS);
    const remainingTowers = towers.filter((t) => t.project_id !== id);
    setStorageItem('towers', remainingTowers);

    const remainingProjects = existing.filter((p) => p.id !== id);
    setStorageItem('projects', remainingProjects);
    await this.logActivity(user, 'delete', 'projects', `قام ${user.full_name} بحذف مشروع ${proj.name} (كود: ${proj.code}).`, id);
  },

  // Towers CRUD
  async getTowers(projectId?: string): Promise<Tower[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        let query = supabase.from('towers').select('*, projects(name)').order('created_at', { ascending: false });
        if (projectId) query = query.eq('project_id', projectId);
        const { data, error } = await query;
        if (!error && data) {
          return data.map((t: any) => ({
            ...t,
            project_name: t.projects?.name,
          })) as Tower[];
        }
      } catch (err) {
        console.warn('Supabase getTowers fallback:', err);
      }
    }

    let towers = getStorageItem<Tower[]>('towers', INITIAL_TOWERS);
    const projects = getStorageItem<Project[]>('projects', INITIAL_PROJECTS);

    towers = towers.map((t) => {
      const p = projects.find((proj) => proj.id === t.project_id);
      return {
        ...t,
        project_name: p ? p.name : 'مشروع غير محدد',
      };
    });

    if (projectId) {
      return towers.filter((t) => t.project_id === projectId);
    }
    return towers;
  },

  async createTower(tower: Omit<Tower, 'id' | 'created_at' | 'updated_at'>, user: { id: string; full_name: string }): Promise<Tower> {
    if (!tower.project_id) {
      throw new Error('لا يمكن إنشاء برج بدون تحديد المشروع التابع له.');
    }

    // Check project exists
    const project = await this.getProjectById(tower.project_id);
    if (!project) throw new Error('المشروع المحدد غير موجود في النظام.');

    // Check unique code within project
    const allTowers = await this.getTowers();
    if (allTowers.some((t) => t.project_id === tower.project_id && t.code.trim().toLowerCase() === tower.code.trim().toLowerCase())) {
      throw new Error(`كود البرج "${tower.code}" مستخدم بالفعل داخل هذا المشروع.`);
    }

    const newTower: Tower = {
      ...tower,
      id: 'tow-' + Math.random().toString(36).substring(2, 9),
      project_name: project.name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('towers')
          .insert([{
            project_id: tower.project_id,
            code: tower.code,
            name: tower.name,
            floors_count: tower.floors_count,
            planned_units_count: tower.planned_units_count,
            tower_type: tower.tower_type,
            start_date: tower.start_date,
            expected_end_date: tower.expected_end_date,
            completion_rate: tower.completion_rate,
            status: tower.status,
            notes: tower.notes,
          }])
          .select()
          .single();
        if (!error && data) {
          await this.logActivity(user, 'create', 'towers', `قام ${user.full_name} بإضافة برج ${tower.name} بمشروع ${project.name}.`, data.id);
          return { ...data, project_name: project.name } as Tower;
        }
      } catch (err) {
        console.warn('Supabase createTower fallback:', err);
      }
    }

    setStorageItem('towers', [newTower, ...allTowers]);
    await this.logActivity(user, 'create', 'towers', `قام ${user.full_name} بإضافة برج ${newTower.name} بمشروع ${project.name}.`, newTower.id);
    return newTower;
  },

  async updateTower(id: string, updates: Partial<Tower>, user: { id: string; full_name: string }): Promise<Tower> {
    const towers = await this.getTowers();
    const index = towers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('البرج غير موجود.');

    const targetProject = updates.project_id ? await this.getProjectById(updates.project_id) : await this.getProjectById(towers[index].project_id);

    const updated = {
      ...towers[index],
      ...updates,
      project_name: targetProject?.name || towers[index].project_name,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('towers')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          await this.logActivity(user, 'update', 'towers', `قام ${user.full_name} بتعديل برج ${updated.name}.`, id);
          return { ...data, project_name: targetProject?.name } as Tower;
        }
      } catch (err) {
        console.warn('Supabase updateTower fallback:', err);
      }
    }

    towers[index] = updated;
    setStorageItem('towers', towers);
    await this.logActivity(user, 'update', 'towers', `قام ${user.full_name} بتعديل برج ${updated.name}.`, id);
    return updated;
  },

  async deleteTower(id: string, user: { id: string; full_name: string }): Promise<void> {
    const towers = await this.getTowers();
    const target = towers.find((t) => t.id === id);
    if (!target) throw new Error('البرج غير موجود.');

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('towers').delete().eq('id', id);
        await this.logActivity(user, 'delete', 'towers', `قام ${user.full_name} بحذف برج ${target.name} (كود: ${target.code}).`, id);
        return;
      } catch (err) {
        console.warn('Supabase deleteTower fallback:', err);
      }
    }

    const remaining = towers.filter((t) => t.id !== id);
    setStorageItem('towers', remaining);
    await this.logActivity(user, 'delete', 'towers', `قام ${user.full_name} بحذف برج ${target.name} (كود: ${target.code}).`, id);
  },

  // Users CRUD
  async getUsers(): Promise<UserProfile[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*, roles(name, key)')
          .order('created_at', { ascending: false });
        if (!error && data) {
          return data.map((u: any) => ({
            ...u,
            role_name: u.roles?.name,
            role_key: u.roles?.key,
          })) as UserProfile[];
        }
      } catch (err) {
        console.warn('Supabase getUsers fallback:', err);
      }
    }

    const users = getStorageItem<UserProfile[]>('users', DEFAULT_USERS);
    const roles = getStorageItem<Role[]>('roles', DEFAULT_ROLES);

    return users.map((u) => {
      const r = roles.find((role) => role.id === u.role_id);
      return {
        ...u,
        role_name: r?.name || 'غير محدد',
        role_key: r?.key || '',
      };
    });
  },

  async createUser(
    userData: { full_name: string; email: string; phone: string; role_id: string; status?: 'active' | 'inactive'; is_active?: boolean },
    passwordOrUser?: string | { id: string; full_name: string },
    optionalCurrentUser?: { id: string; full_name: string }
  ): Promise<UserProfile> {
    const password = typeof passwordOrUser === 'string' ? passwordOrUser : 'Password123*';
    const currentUser = (typeof passwordOrUser === 'object' && passwordOrUser !== null)
      ? passwordOrUser
      : (optionalCurrentUser || { id: 'admin', full_name: 'مدير النظام' });
    const userStatus: 'active' | 'inactive' = userData.status || (userData.is_active === false ? 'inactive' : 'active');

    const existing = await this.getUsers();
    if (existing.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error(`البريد الإلكتروني "${userData.email}" مسجل بالفعل في النظام.`);
    }

    const roles = await this.getRoles();
    const role = roles.find((r) => r.id === userData.role_id);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Create user via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: password,
          options: {
            data: {
              full_name: userData.full_name,
              phone: userData.phone,
              role_id: userData.role_id,
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          const { data: profile, error: profError } = await supabase
            .from('profiles')
            .upsert([{
              id: authData.user.id,
              full_name: userData.full_name,
              email: userData.email,
              phone: userData.phone,
              role_id: userData.role_id,
              status: userStatus,
            }])
            .select()
            .single();

          if (!profError && profile) {
            await this.logActivity(currentUser, 'create', 'users', `قام ${currentUser.full_name} بإضافة مستخدم جديد: ${userData.full_name} بدور ${role?.name || ''}.`, profile.id);
            return {
              ...profile,
              role_name: role?.name,
              role_key: role?.key
            } as UserProfile;
          }
        }
      } catch (err: any) {
        console.warn('Supabase createUser auth fallback or error:', err);
        throw new Error(err.message || 'فشل إنشاء المستخدم في Supabase Auth');
      }
    }

    const newUser: UserProfile = {
      full_name: userData.full_name,
      email: userData.email,
      phone: userData.phone,
      role_id: userData.role_id,
      status: userStatus,
      id: 'user-' + Math.random().toString(36).substring(2, 9),
      role_name: role?.name || 'مستخدم',
      role_key: role?.key || '',
      created_at: new Date().toISOString(),
      last_sign_in_at: null,
    };

    setStorageItem('users', [newUser, ...existing]);
    await this.logActivity(currentUser, 'create', 'users', `قام ${currentUser.full_name} بإضافة مستخدم جديد: ${userData.full_name} بدور ${role?.name || ''}.`, newUser.id);
    return newUser;
  },

  async updateUser(id: string, updates: Partial<UserProfile>, currentUser: { id: string; full_name: string }): Promise<UserProfile> {
    const users = await this.getUsers();
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('المستخدم غير موجود.');

    const roles = await this.getRoles();
    const role = updates.role_id ? roles.find((r) => r.id === updates.role_id) : roles.find((r) => r.id === users[index].role_id);

    const updated: UserProfile = {
      ...users[index],
      ...updates,
      role_name: role?.name || users[index].role_name,
      role_key: role?.key || users[index].role_key,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .update({
            full_name: updated.full_name,
            phone: updated.phone,
            role_id: updated.role_id,
            status: updated.status,
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .select()
          .single();
        if (!error && data) {
          await this.logActivity(currentUser, 'update', 'users', `قام ${currentUser.full_name} بتعديل بيانات المستخدم: ${updated.full_name}.`, id);
          return {
            ...data,
            role_name: role?.name,
            role_key: role?.key,
          } as UserProfile;
        }
      } catch (err) {
        console.warn('Supabase updateUser fallback:', err);
      }
    }

    users[index] = updated;
    setStorageItem('users', users);
    await this.logActivity(currentUser, 'update', 'users', `قام ${currentUser.full_name} بتعديل بيانات المستخدم: ${updated.full_name}.`, id);
    return updated;
  },

  async deleteUser(id: string, currentUser: { id: string; full_name: string }): Promise<void> {
    if (id === currentUser.id) {
      throw new Error('لا يمكنك حذف حسابك الشخصي أثناء تسجيل الدخول.');
    }

    const users = await this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) throw new Error('المستخدم غير موجود.');

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('profiles').delete().eq('id', id);
        await this.logActivity(currentUser, 'delete', 'users', `قام ${currentUser.full_name} بحذف حساب المستخدم: ${target.full_name}.`, id);
        return;
      } catch (err) {
        console.warn('Supabase deleteUser fallback:', err);
      }
    }

    const remaining = users.filter((u) => u.id !== id);
    setStorageItem('users', remaining);
    await this.logActivity(currentUser, 'delete', 'users', `قام ${currentUser.full_name} بحذف حساب المستخدم: ${target.full_name}.`, id);
  },

  // Roles & Permissions
  async getPermissions(): Promise<Permission[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('permissions').select('*');
        if (!error && data && data.length > 0) return data as Permission[];
      } catch (err) {
        console.warn('Supabase getPermissions fallback:', err);
      }
    }
    return ALL_PERMISSIONS;
  },

  async getRolePermissions(roleId: string): Promise<string[]> {
    const map = await this.getRolePermissionsMap();
    return map[roleId] || [];
  },

  async getRoles(): Promise<Role[]> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('roles').select('*').order('created_at', { ascending: true });
        if (!error && data && data.length > 0) return data as Role[];
      } catch (err) {
        console.warn('Supabase getRoles fallback:', err);
      }
    }
    return getStorageItem<Role[]>('roles', DEFAULT_ROLES);
  },

  async getRolePermissionsMap(): Promise<Record<string, string[]>> {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('role_permissions')
          .select('role_id, permissions(code)');
        if (!error && data) {
          const map: Record<string, string[]> = {};
          data.forEach((item: any) => {
            if (!map[item.role_id]) map[item.role_id] = [];
            if (item.permissions?.code) {
              map[item.role_id].push(item.permissions.code);
            }
          });
          return map;
        }
      } catch (err) {
        console.warn('Supabase getRolePermissionsMap fallback:', err);
      }
    }

    return getStorageItem<Record<string, string[]>>('role_permissions', DEFAULT_ROLE_PERMISSION_CODES);
  },

  async updateRolePermissions(roleId: string, permissionCodes: string[], currentUser: { id: string; full_name: string }): Promise<void> {
    const roles = await this.getRoles();
    const role = roles.find((r) => r.id === roleId || r.key === roleId);
    const roleKey = role ? (role.key || role.id) : roleId;

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        // Get all permission records corresponding to these codes
        const { data: perms } = await supabase.from('permissions').select('id, code').in('code', permissionCodes);
        if (perms) {
          // Delete existing role permissions
          await supabase.from('role_permissions').delete().eq('role_id', role?.id || roleId);
          // Insert new
          const rows = perms.map((p) => ({
            role_id: role?.id || roleId,
            permission_id: p.id,
          }));
          if (rows.length > 0) {
            await supabase.from('role_permissions').insert(rows);
          }
          await this.logActivity(currentUser, 'update', 'roles_permissions', `قام ${currentUser.full_name} بتعديل صلاحيات دور ${role?.name || roleKey}.`, roleId);
          return;
        }
      } catch (err) {
        console.warn('Supabase updateRolePermissions fallback:', err);
      }
    }

    const currentMap = getStorageItem<Record<string, string[]>>('role_permissions', DEFAULT_ROLE_PERMISSION_CODES);
    currentMap[roleKey] = permissionCodes;
    currentMap[roleId] = permissionCodes;
    setStorageItem('role_permissions', currentMap);
    await this.logActivity(currentUser, 'update', 'roles_permissions', `قام ${currentUser.full_name} بتحديث صلاحيات دور ${role?.name || roleKey}.`, roleId);
  },

  // Dashboard Aggregated Stats (Live from DB)
  async getDashboardStats() {
    const projects = await this.getProjects();
    const towers = await this.getTowers();
    const users = await this.getUsers();
    const activityLogs = await this.getActivityLogs(6);

    const totalProjects = projects.length;
    const inProgressProjects = projects.filter((p) => p.status === 'in_progress').length;
    const completedProjects = projects.filter((p) => p.status === 'completed').length;
    const totalTowers = towers.length;
    const totalUsers = users.length;
    const activeUsers = users.filter((u) => u.status === 'active').length;

    // Recent 5 projects
    const recentProjects = [...projects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

    return {
      totalProjects,
      inProgressProjects,
      completedProjects,
      totalTowers,
      totalUsers,
      activeUsers,
      recentProjects,
      recentActivity: activityLogs,
    };
  }
};
