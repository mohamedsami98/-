export type SystemModule = 
  | 'dashboard'
  | 'projects'
  | 'towers'
  | 'costs'
  | 'inventory'
  | 'installments'
  | 'banking'
  | 'users'
  | 'roles_permissions'
  | 'activity_logs'
  | 'settings'
  | 'reports';

export type PermissionAction = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'print'
  | 'export';

export interface Permission {
  id: string;
  module: SystemModule;
  module_ar: string;
  action: PermissionAction;
  action_ar: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  key: string;
  code?: string;
  description: string;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RolePermission {
  id: string;
  role_id: string;
  permission_id: string;
  created_at?: string;
}

export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role_id: string;
  role_name?: string;
  role_key?: string;
  status: UserStatus;
  is_active?: boolean;
  created_at: string;
  updated_at?: string;
  last_sign_in_at?: string | null;
  last_login_at?: string | null;
}

export type User = UserProfile;

export type ProjectType = 'residential' | 'commercial' | 'administrative' | 'mixed' | 'other';
export type ProjectStatus = 'planned' | 'in_progress' | 'paused' | 'completed';

export interface Project {
  id: string;
  code: string;
  name: string;
  owner_name: string;
  location: string;
  detailed_address: string;
  project_type: ProjectType;
  start_date: string;
  expected_end_date: string;
  actual_end_date?: string | null;
  project_manager_name: string;
  estimated_budget: number;
  completion_rate: number;
  status: ProjectStatus;
  description: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  towers_count?: number;
}

export type TowerType = 'residential' | 'commercial' | 'administrative' | 'mixed';
export type TowerStatus = 'planned' | 'in_progress' | 'paused' | 'completed';

export interface Tower {
  id: string;
  project_id: string;
  project_name?: string;
  code: string;
  name: string;
  floors_count: number;
  planned_units_count: number;
  tower_type: TowerType;
  start_date: string;
  expected_end_date: string;
  completion_rate: number;
  actual_completion_percentage?: number;
  status: TowerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  user_name: string;
  action_type: 'create' | 'update' | 'delete' | 'approve' | 'auth';
  action?: string;
  module: SystemModule | 'auth';
  record_id?: string;
  description: string;
  created_at: string;
  ip_address?: string;
}

export interface CompanySettings {
  id: string;
  company_name: string;
  system_name: string;
  phone: string;
  company_phone?: string;
  email: string;
  company_email?: string;
  address: string;
  company_address?: string;
  tax_number: string;
  commercial_registry: string;
  default_currency: string;
  logo_url: string;
  supabase_url?: string;
  supabase_anon_key?: string;
  updated_at: string;
}

// ============================================================================
// COSTS, EXPENSES & UNIT ALLOCATION
// ============================================================================

export type CostCategory = 
  | 'building_materials'       // مواد بناء وتوريدات خرسانية
  | 'labor_subcontractors'     // أجور ومصنعيات ومقاولين باطن
  | 'machinery_equipment'      // إيجار وتشغيل معدات وآليات
  | 'engineering_supervision'  // إشراف هندسي وتصميم واستشارات
  | 'site_administrative'      // مصاريف إدارية وموقع ونثريات
  | 'permits_fees'             // تراخيص ورسوم وتأمينات حكومية
  | 'other';                   // بنود ومصروفات أخرى

export interface Expense {
  id: string;
  project_id: string;
  project_name?: string;
  tower_id: string;
  tower_name?: string;
  category: CostCategory;
  category_ar?: string;
  amount: number;
  expense_date: string;
  invoice_number?: string;
  supplier_beneficiary: string;
  payment_method: 'cash' | 'bank_transfer' | 'cheque';
  bank_account_id?: string;
  bank_account_name?: string;
  description: string;
  notes?: string;
  created_at: string;
  created_by_id?: string;
  created_by_name?: string;
}

export type UnitType = 
  | 'apartment'              // شقة سكنية
  | 'duplex'                 // دوبلكس
  | 'commercial_shop'        // محل تجاري
  | 'administrative_office'  // مكتب إداري
  | 'clinic'                 // عيادة طبية
  | 'penthouse';             // بنتهاوس / روف

export type UnitStatus = 'available' | 'reserved' | 'sold';

export interface TowerUnit {
  id: string;
  tower_id: string;
  tower_name?: string;
  project_id: string;
  project_name?: string;
  unit_number: string;
  floor_number: number;
  unit_type: UnitType;
  area_sqm: number;
  selling_price: number;
  status: UnitStatus;
  allocated_cost: number;
  cost_per_sqm: number;
  notes?: string;
  client_name?: string;
  updated_at?: string;
}

// ============================================================================
// WAREHOUSES & RAW MATERIALS INVENTORY
// ============================================================================

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  location: string;
  keeper_name: string;
  phone: string;
  notes?: string;
  created_at?: string;
}

export type MaterialCategory = 
  | 'concrete_structural' // خرسانة وحديد وهيكل
  | 'finishes'            // تشطيبات وسيراميك ودهانات
  | 'plumbing'            // صحي وسباكة ومحابس
  | 'electrical'          // كهرباء وكابلات وإنارة
  | 'insulation'          // عوازل مائية وحرارية
  | 'general';            // خامات وأدوات عامة

export interface MaterialItem {
  id: string;
  code: string;
  name: string;
  category: MaterialCategory;
  unit: string; // طن، متر مكعب، شيكارة، لفة، ألف طوبة
  current_quantity: number;
  avg_unit_cost: number;
  min_stock_level: number;
  warehouse_id: string;
  warehouse_name?: string;
  last_received_at?: string;
}

export interface InventoryTransaction {
  id: string;
  transaction_type: 'inward' | 'outward'; // إضافة توريد / صرف على برج
  item_id: string;
  item_name: string;
  item_code: string;
  warehouse_id: string;
  warehouse_name: string;
  quantity: number;
  unit_price: number;
  total_cost: number;
  transaction_date: string;
  document_number: string;
  supplier_name?: string;        // في حالة التوريد
  project_id?: string;           // في حالة الصرف
  project_name?: string;
  tower_id?: string;             // في حالة الصرف على برج
  tower_name?: string;
  engineer_recipient?: string;   // المهندس المستلم
  notes?: string;
  created_at: string;
}

// ============================================================================
// BANKING & INSTALLMENTS COLLECTION
// ============================================================================

export type PaymentMethod = 'cash' | 'bank_transfer' | 'cheque';
export type InstallmentStatus = 'paid' | 'pending' | 'overdue' | 'partially_paid';

export interface BankAccount {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  branch?: string;
  account_type: 'bank' | 'cashbox' | 'bank_current' | 'bank_saving'; // حساب بنكي / خزينة نقدية
  balance: number;
  currency: string;
  is_active: boolean;
}

export interface BankTransaction {
  id: string;
  account_id: string;
  account_name: string;
  bank_account_id?: string;
  bank_account_name?: string;
  transaction_type: 'deposit' | 'withdrawal';
  amount: number;
  transaction_date: string;
  reference_number?: string;
  reference_type?: string;
  description: string;
  category: 'installment_payment' | 'expense_payout' | 'transfer' | 'other';
  balance_after: number;
  created_at: string;
}

export interface ContractInstallment {
  id: string;
  contract_number: string;
  client_name: string;
  client_phone: string;
  client_national_id?: string;
  project_id: string;
  project_name: string;
  tower_id: string;
  tower_name: string;
  unit_id: string;
  unit_number: string;
  unit_area_sqm?: number;
  unit_type?: UnitType;
  total_unit_price: number;
  paid_amount: number;
  remaining_amount: number;
  installment_title: string;
  installment_number: number;
  total_installments_count: number;
  due_date: string;
  amount: number;
  status: InstallmentStatus;
  payment_date?: string;
  payment_method?: PaymentMethod;
}

export interface InstallmentPaymentReceipt {
  id: string;
  receipt_number: string; // سند قبض رقم
  installment_id: string;
  contract_number: string;
  client_name: string;
  project_name?: string;
  tower_name?: string;
  unit_number?: string;
  installment_title?: string;
  amount: number;
  amount_paid?: number; // alias
  payment_date: string;
  payment_method: PaymentMethod;
  bank_account_id: string;
  bank_account_name: string;
  transfer_reference?: string;
  transfer_reference_number?: string;
  cheque_number?: string;
  cheque_bank_name?: string;
  cheque_due_date?: string;
  cheque_status?: 'under_collection' | 'cleared' | 'bounced';
  notes?: string;
  created_at: string;
  created_by_name: string;
  received_by_user_name?: string;
}

