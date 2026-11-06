export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- نظام إدارة شركة المقاولات والتطوير العقاري - جمهورية مصر العربية
-- Phase 1: Database Schema & Row Level Security for Supabase / PostgreSQL
-- ==============================================================================

-- 1. Create Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    key VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Create Permissions Table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    module_ar VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    action_ar VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 4. Create Role-Permissions Junction Table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(role_id, permission_id)
);

-- 5. Create Profiles Table (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(30),
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    last_sign_in_at TIMESTAMPTZ
);

-- 6. Create Projects Table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    owner_name VARCHAR(150) NOT NULL,
    location VARCHAR(150) NOT NULL,
    detailed_address TEXT,
    project_type VARCHAR(50) NOT NULL CHECK (project_type IN ('residential', 'commercial', 'administrative', 'mixed', 'other')),
    start_date DATE NOT NULL,
    expected_end_date DATE NOT NULL,
    actual_end_date DATE,
    project_manager_name VARCHAR(150),
    estimated_budget NUMERIC(15, 2) DEFAULT 0.00,
    completion_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'paused', 'completed')),
    description TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Create Towers Table (Linked to Projects)
CREATE TABLE IF NOT EXISTS public.towers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    floors_count INT DEFAULT 1 CHECK (floors_count >= 1),
    planned_units_count INT DEFAULT 0 CHECK (planned_units_count >= 0),
    tower_type VARCHAR(50) NOT NULL CHECK (tower_type IN ('residential', 'commercial', 'administrative', 'mixed')),
    start_date DATE NOT NULL,
    expected_end_date DATE NOT NULL,
    completion_rate NUMERIC(5, 2) DEFAULT 0.00 CHECK (completion_rate >= 0 AND completion_rate <= 100),
    status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'paused', 'completed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(project_id, code)
);

-- 8. Create Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    module VARCHAR(50) NOT NULL,
    record_id VARCHAR(100),
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Create Company Settings Table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(200) NOT NULL DEFAULT 'شركة المقاولات والتطوير العقاري المصرية',
    system_name VARCHAR(200) NOT NULL DEFAULT 'نظام إدارة شركة المقاولات والتطوير العقاري',
    phone VARCHAR(50) DEFAULT '01000000000',
    email VARCHAR(100) DEFAULT 'info@realestate-egypt.com',
    address TEXT DEFAULT 'القاهرة الجديدة، التجمع الخامس، جمهورية مصر العربية',
    tax_number VARCHAR(50) DEFAULT '123-456-789',
    commercial_registry VARCHAR(50) DEFAULT '987654',
    default_currency VARCHAR(20) DEFAULT 'EGP',
    logo_url TEXT DEFAULT '',
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 10. Indexes for Fast Querying
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON public.projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);
CREATE INDEX IF NOT EXISTS idx_towers_project_id ON public.towers(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role_id);

-- 11. Enable Row Level Security (RLS)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.towers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- 12. Row Level Security Policies
-- Authenticated users can read company settings, roles, permissions, projects, towers
CREATE POLICY "Allow authenticated read company_settings" ON public.company_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read roles" ON public.roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read permissions" ON public.permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read projects" ON public.projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read towers" ON public.towers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read activity_logs" ON public.activity_logs FOR SELECT TO authenticated USING (true);

-- Mutations allowed for authenticated users according to application rules
CREATE POLICY "Allow authenticated write projects" ON public.projects FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write towers" ON public.towers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated insert activity_logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated write company_settings" ON public.company_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated update profiles" ON public.profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated manage role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 13. Seed Initial Roles
INSERT INTO public.roles (id, name, key, description, is_system) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'مدير النظام', 'system_admin', 'كامل الصلاحيات والتحكم في النظام والمستخدمين والإعدادات', true),
  ('a0000000-0000-0000-0000-000000000002', 'مدير الشركة', 'company_manager', 'صلاحيات الإشراف العام والمتابعة والاعتمادات والتقارير', false),
  ('a0000000-0000-0000-0000-000000000003', 'مدير المشروع', 'project_manager', 'إدارة المشروعات والأبراج ومتابعة نسب الإنجاز', false),
  ('a0000000-0000-0000-0000-000000000004', 'المحاسب', 'accountant', 'صلاحيات المالية والميزانيات والتقارير', false),
  ('a0000000-0000-0000-0000-000000000005', 'مسؤول المشتريات', 'procurement_officer', 'صلاحيات طلبات الشراء والمناقصات والموردين مستقبلاً', false),
  ('a0000000-0000-0000-0000-000000000006', 'أمين المخزن', 'storekeeper', 'صلاحيات حركة المواد والتوريدات المخزنية مستقبلاً', false),
  ('a0000000-0000-0000-0000-000000000007', 'موظف المبيعات', 'sales_officer', 'عرض المشروعات وتفاصيل الأبراج والوحدات', false),
  ('a0000000-0000-0000-0000-000000000008', 'موظف التحصيل', 'collection_officer', 'صلاحيات التحصيل والمتابعة المالية مستقبلاً', false)
ON CONFLICT (key) DO NOTHING;

-- 14. Seed Company Settings Single Record
INSERT INTO public.company_settings (id, company_name, system_name, phone, email, address, tax_number, commercial_registry, default_currency, logo_url)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'شركة النخبة للمقاولات والتطوير العقاري',
  'نظام إدارة شركة المقاولات والتطوير العقاري',
  '01023456789',
  'contact@el-nokhba.com.eg',
  'القاهرة الجديدة، التجمع الخامس، محور التسعين الشمالي، جمهورية مصر العربية',
  '456-789-123',
  '102938',
  'EGP',
  ''
)
ON CONFLICT (id) DO NOTHING;
-- 15. Expenses & Tower Costs Table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  tower_id UUID REFERENCES public.towers(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  category_ar VARCHAR(100),
  amount NUMERIC(15, 2) NOT NULL,
  expense_date DATE NOT NULL,
  invoice_number VARCHAR(100),
  supplier_beneficiary VARCHAR(255) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  bank_account_id UUID,
  description TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_id UUID REFERENCES public.profiles(id)
);

-- 16. Tower Units Table & Cost Allocation
CREATE TABLE IF NOT EXISTS public.tower_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tower_id UUID REFERENCES public.towers(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  unit_number VARCHAR(50) NOT NULL,
  floor_number INT NOT NULL,
  unit_type VARCHAR(50) NOT NULL,
  area_sqm NUMERIC(10, 2) NOT NULL,
  selling_price NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'available',
  allocated_cost NUMERIC(15, 2) DEFAULT 0,
  cost_per_sqm NUMERIC(15, 2) DEFAULT 0,
  client_name VARCHAR(255),
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Warehouses Table
CREATE TABLE IF NOT EXISTS public.warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  location TEXT NOT NULL,
  keeper_name VARCHAR(255),
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Material Raw Items Table
CREATE TABLE IF NOT EXISTS public.material_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  current_quantity NUMERIC(12, 2) DEFAULT 0,
  avg_unit_cost NUMERIC(15, 2) DEFAULT 0,
  min_stock_level NUMERIC(12, 2) DEFAULT 0,
  last_received_at TIMESTAMPTZ
);

-- 19. Inventory Transactions (Inward Receipts & Outward Issues to Towers)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type VARCHAR(20) NOT NULL, -- 'inward' or 'outward'
  item_id UUID REFERENCES public.material_items(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES public.warehouses(id) ON DELETE CASCADE,
  quantity NUMERIC(12, 2) NOT NULL,
  unit_price NUMERIC(15, 2) NOT NULL,
  total_cost NUMERIC(15, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  document_number VARCHAR(100) NOT NULL,
  supplier_name VARCHAR(255),
  project_id UUID REFERENCES public.projects(id),
  tower_id UUID REFERENCES public.towers(id),
  engineer_recipient VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. Bank Accounts & Treasuries
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name VARCHAR(255) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(100) NOT NULL,
  branch VARCHAR(255),
  account_type VARCHAR(50) DEFAULT 'bank',
  balance NUMERIC(18, 2) DEFAULT 0,
  currency VARCHAR(10) DEFAULT 'EGP',
  is_active BOOLEAN DEFAULT true
);

-- 21. Bank Transactions Table
CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL, -- deposit / withdrawal
  amount NUMERIC(18, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  reference_number VARCHAR(100),
  description TEXT NOT NULL,
  category VARCHAR(50),
  balance_after NUMERIC(18, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 22. Contract Installments Table
CREATE TABLE IF NOT EXISTS public.contract_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number VARCHAR(100) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_phone VARCHAR(50) NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  tower_id UUID REFERENCES public.towers(id),
  unit_id UUID REFERENCES public.tower_units(id),
  total_unit_price NUMERIC(15, 2) NOT NULL,
  paid_amount NUMERIC(15, 2) DEFAULT 0,
  remaining_amount NUMERIC(15, 2) NOT NULL,
  installment_title VARCHAR(255) NOT NULL,
  installment_number INT NOT NULL,
  total_installments_count INT NOT NULL,
  due_date DATE NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50)
);

-- 23. Installment Receipts & Cheques
CREATE TABLE IF NOT EXISTS public.installment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  installment_id UUID REFERENCES public.contract_installments(id) ON DELETE CASCADE,
  contract_number VARCHAR(100) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  transfer_reference VARCHAR(100),
  cheque_number VARCHAR(100),
  cheque_bank_name VARCHAR(255),
  cheque_due_date DATE,
  cheque_status VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by_name VARCHAR(255)
);

-- Enable RLS for newly created tables
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tower_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installment_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write expenses" ON public.expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read tower_units" ON public.tower_units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write tower_units" ON public.tower_units FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read warehouses" ON public.warehouses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write warehouses" ON public.warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read material_items" ON public.material_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write material_items" ON public.material_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read inventory_transactions" ON public.inventory_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write inventory_transactions" ON public.inventory_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read bank_accounts" ON public.bank_accounts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write bank_accounts" ON public.bank_accounts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read bank_transactions" ON public.bank_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write bank_transactions" ON public.bank_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read contract_installments" ON public.contract_installments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write contract_installments" ON public.contract_installments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated read installment_receipts" ON public.installment_receipts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated write installment_receipts" ON public.installment_receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);
`;

export const FULL_POSTGRES_SCHEMA = SUPABASE_SQL_SCHEMA;
