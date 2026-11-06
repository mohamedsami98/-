import { 
  Expense, 
  TowerUnit, 
  Warehouse, 
  MaterialItem, 
  InventoryTransaction, 
  BankAccount, 
  BankTransaction, 
  ContractInstallment, 
  InstallmentPaymentReceipt,
  CostCategory
} from '../types';
import { getSupabaseClient, isSupabaseConfigured, dataService } from './supabase';

const STORAGE_PREFIX = 'elnokhba_';

const getLocal = <T>(key: string, def: T): T => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    return raw ? JSON.parse(raw) : def;
  } catch (e) {
    console.error(`Error reading ${key}`, e);
    return def;
  }
};

const setLocal = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(val));
  } catch (e) {
    console.error(`Error writing ${key}`, e);
  }
};

// ============================================================================
// SEED DATA
// ============================================================================

export const INITIAL_BANK_ACCOUNTS: BankAccount[] = [
  {
    id: 'bank-nbe-01',
    bank_name: 'البنك الأهلي المصري (NBE)',
    account_name: 'شركة النخبة للتطوير العقاري - حساب جاري رئيسي',
    account_number: '1092837465001',
    branch: 'فرع التسعين - القاهرة الجديدة',
    account_type: 'bank',
    balance: 14850000,
    currency: 'EGP',
    is_active: true,
  },
  {
    id: 'bank-misr-02',
    bank_name: 'بنك مصر (Banque Misr)',
    account_name: 'شركة النخبة - حساب تحصيلات أقساط العاصمة الإدارية',
    account_number: '2049583726002',
    branch: 'فرع العاصمة الإدارية',
    account_type: 'bank',
    balance: 9200000,
    currency: 'EGP',
    is_active: true,
  },
  {
    id: 'bank-cib-03',
    bank_name: 'البنك التجاري الدولي (CIB)',
    account_name: 'شركة النخبة - حساب الموردين ومقاولي الباطن',
    account_number: '3084759201003',
    branch: 'فرع التجمع الخامس',
    account_type: 'bank',
    balance: 6400000,
    currency: 'EGP',
    is_active: true,
  },
  {
    id: 'cashbox-main-04',
    bank_name: 'خزينة المركز الرئيسي النقدية',
    account_name: 'الخزينة النقدية الرئيسية - القاهرة الجديدة',
    account_number: 'CASH-HQ-01',
    branch: 'المقر الإداري الرئيسي',
    account_type: 'cashbox',
    balance: 450000,
    currency: 'EGP',
    is_active: true,
  },
];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-tagamoa-01',
    code: 'WH-TAG-01',
    name: 'مستودع موقع جوهرة التجمع الخامس',
    location: 'بيت الوطن، الحي الرابع، التجمع الخامس',
    keeper_name: 'الأستاذ سعيد عبد المجيد',
    phone: '01019283746',
    notes: 'مخزن رئيسي لتوريدات الأسمنت والحديد ومواد البناء الأساسية',
  },
  {
    id: 'wh-nac-02',
    code: 'WH-NAC-02',
    name: 'مستودع برج الأعمال - العاصمة الإدارية',
    location: 'حي المال والأعمال، العاصمة الإدارية الجديدة',
    keeper_name: 'الأستاذ إبراهيم فتحي',
    phone: '01128374659',
    notes: 'مخزن التوريدات الخاصة بالأعمال الإدارية والواجهات',
  },
  {
    id: 'wh-central-03',
    code: 'WH-CEN-03',
    name: 'المخزن المركزي للتشطيبات والمهمات - المقطم',
    location: 'المنطقة الصناعية، المقطم، القاهرة',
    keeper_name: 'المهندس مصطفى عثمان',
    phone: '01238475610',
    notes: 'مخزن مخصص للسيراميك والأدوات الصحية والأطقم والأسلاك الكهربائية',
  }
];

export const INITIAL_MATERIAL_ITEMS: MaterialItem[] = [
  {
    id: 'mat-001',
    code: 'MAT-ST-16',
    name: 'حديد تسليح عز قياسي قطر 16 مم',
    category: 'concrete_structural',
    unit: 'طن',
    current_quantity: 45,
    avg_unit_cost: 39500,
    min_stock_level: 15,
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    last_received_at: '2025-02-15T10:00:00.000Z',
  },
  {
    id: 'mat-002',
    code: 'MAT-ST-12',
    name: 'حديد تسليح عز قياسي قطر 12 مم',
    category: 'concrete_structural',
    unit: 'طن',
    current_quantity: 38,
    avg_unit_cost: 39500,
    min_stock_level: 12,
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    last_received_at: '2025-02-14T11:00:00.000Z',
  },
  {
    id: 'mat-003',
    code: 'MAT-CEM-42',
    name: 'أسمنت بورتلاندي ممتاز لافارج 42.5',
    category: 'concrete_structural',
    unit: 'طن (20 شيكارة)',
    current_quantity: 120,
    avg_unit_cost: 2450,
    min_stock_level: 30,
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    last_received_at: '2025-02-16T09:30:00.000Z',
  },
  {
    id: 'mat-004',
    code: 'MAT-SND-01',
    name: 'رمل محاجر حرش عالي النقاء للخرسانات',
    category: 'concrete_structural',
    unit: 'متر مكعب (م³)',
    current_quantity: 350,
    avg_unit_cost: 160,
    min_stock_level: 100,
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    last_received_at: '2025-02-10T14:00:00.000Z',
  },
  {
    id: 'mat-005',
    code: 'MAT-GRV-02',
    name: 'سن 2 متدرج ومغسول للأعمال الخرسانية',
    category: 'concrete_structural',
    unit: 'متر مكعب (م³)',
    current_quantity: 420,
    avg_unit_cost: 290,
    min_stock_level: 100,
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    last_received_at: '2025-02-12T15:00:00.000Z',
  },
  {
    id: 'mat-006',
    code: 'MAT-BRK-RED',
    name: 'طوب طفلي مفرغ قياسي 25×12×12 سم',
    category: 'concrete_structural',
    unit: 'ألف طوبة',
    current_quantity: 85,
    avg_unit_cost: 1950,
    min_stock_level: 25,
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    last_received_at: '2025-02-08T09:00:00.000Z',
  },
  {
    id: 'mat-007',
    code: 'MAT-ELC-SWD',
    name: 'كابلات وأسلاك سويدي نحاس معزول 4 مم',
    category: 'electrical',
    unit: 'لفة (100 متر)',
    current_quantity: 110,
    avg_unit_cost: 1650,
    min_stock_level: 30,
    warehouse_id: 'wh-central-03',
    warehouse_name: 'المخزن المركزي للتشطيبات والمهمات - المقطم',
    last_received_at: '2025-02-18T12:00:00.000Z',
  },
  {
    id: 'mat-008',
    code: 'MAT-CER-PORC',
    name: 'بورسلين إسباني فرز أول أرضيات 60×120',
    category: 'finishes',
    unit: 'متر مسطح (م²)',
    current_quantity: 450,
    avg_unit_cost: 580,
    min_stock_level: 150,
    warehouse_id: 'wh-central-03',
    warehouse_name: 'المخزن المركزي للتشطيبات والمهمات - المقطم',
    last_received_at: '2025-02-05T16:00:00.000Z',
  }
];

export const INITIAL_INVENTORY_TXS: InventoryTransaction[] = [
  {
    id: 'tx-001',
    transaction_type: 'inward',
    item_id: 'mat-001',
    item_name: 'حديد تسليح عز قياسي قطر 16 مم',
    item_code: 'MAT-ST-16',
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    quantity: 30,
    unit_price: 39500,
    total_cost: 1185000,
    transaction_date: '2025-02-10',
    document_number: 'INV-IN-2025-081',
    supplier_name: 'شركة حديد عز - التوزيع المعتمد',
    notes: 'توريد دفعة حديد جديدة للموقع بناءً على أمر التوريد رقم PO-441',
    created_at: '2025-02-10T11:00:00.000Z',
  },
  {
    id: 'tx-002',
    transaction_type: 'outward',
    item_id: 'mat-001',
    item_name: 'حديد تسليح عز قياسي قطر 16 مم',
    item_code: 'MAT-ST-16',
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    quantity: 12,
    unit_price: 39500,
    total_cost: 474000,
    transaction_date: '2025-02-14',
    document_number: 'ISS-OUT-2025-032',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    engineer_recipient: 'المهندس حسام الدين ممدوح',
    notes: 'صرف حديد تسليح لأعمال صب أعمدة الطابق الحادي عشر',
    created_at: '2025-02-14T14:30:00.000Z',
  },
  {
    id: 'tx-003',
    transaction_type: 'outward',
    item_id: 'mat-003',
    item_name: 'أسمنت بورتلاندي ممتاز لافارج 42.5',
    item_code: 'MAT-CEM-42',
    warehouse_id: 'wh-tagamoa-01',
    warehouse_name: 'مستودع موقع جوهرة التجمع الخامس',
    quantity: 40,
    unit_price: 2450,
    total_cost: 98000,
    transaction_date: '2025-02-16',
    document_number: 'ISS-OUT-2025-033',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-002',
    tower_name: 'برج الزمرد B',
    engineer_recipient: 'المهندس ياسر فوزي',
    notes: 'صرف أسمنت لأعمال المحارة والبناء الداخلية',
    created_at: '2025-02-16T10:15:00.000Z',
  }
];

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-001',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    category: 'building_materials',
    category_ar: 'مواد بناء وتوريدات خرسانية',
    amount: 1450000,
    expense_date: '2025-02-05',
    invoice_number: 'INV-CEM-902',
    supplier_beneficiary: 'شركة مصر للخرسانة الجاهزة',
    payment_method: 'bank_transfer',
    bank_account_id: 'bank-nbe-01',
    bank_account_name: 'البنك الأهلي المصري (حساب رئيسي)',
    description: 'توريد وصب خرسانة جاهزة لسقف الدور العاشر بمضخة 42 متر',
    notes: 'معاينة واعتماد مكعبات الكسر من الاستشاري بنجاح',
    created_at: '2025-02-05T12:00:00.000Z',
    created_by_name: 'المهندس حسام ممدوح',
  },
  {
    id: 'exp-002',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    category: 'labor_subcontractors',
    category_ar: 'أجور ومصنعيات ومقاولين باطن',
    amount: 420000,
    expense_date: '2025-02-10',
    invoice_number: 'SUB-CTR-102',
    supplier_beneficiary: 'مقاولات الحاج صلاح لنجارة وحدادة الخرسانات',
    payment_method: 'cheque',
    bank_account_id: 'bank-cib-03',
    bank_account_name: 'البنك التجاري الدولي (CIB)',
    description: 'المستخلص رقم 6 لأعمال نجارة وحدادة الهيكل الخرساني لبرج الياقوت A',
    notes: 'شيك رقم 90812 يستحق الصرف في 2025-02-28',
    created_at: '2025-02-10T15:00:00.000Z',
    created_by_name: 'محمود إبراهيم (المحاسب)',
  },
  {
    id: 'exp-003',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    category: 'machinery_equipment',
    category_ar: 'إيجار وتشغيل معدات وآليات',
    amount: 180000,
    expense_date: '2025-02-12',
    invoice_number: 'EQP-CRN-401',
    supplier_beneficiary: 'شركة الدلتا للأوناش والمعدات الثقيلة',
    payment_method: 'cash',
    bank_account_id: 'cashbox-main-04',
    bank_account_name: 'خزينة المركز الرئيسي النقدية',
    description: 'تشغيل ونش البرج ورافعة المواد لمدة شهر شاملة السولار والصيانة',
    notes: 'تمت المراجعة بواسطة مسؤول الحركة والمعدات',
    created_at: '2025-02-12T14:20:00.000Z',
    created_by_name: 'محمود إبراهيم',
  },
  {
    id: 'exp-004',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-002',
    tower_name: 'برج الزمرد B',
    category: 'building_materials',
    category_ar: 'مواد بناء وتوريدات خرسانية',
    amount: 980000,
    expense_date: '2025-02-08',
    invoice_number: 'INV-STL-551',
    supplier_beneficiary: 'حديد عز - قطاع المقاولات',
    payment_method: 'bank_transfer',
    bank_account_id: 'bank-nbe-01',
    bank_account_name: 'البنك الأهلي المصري (حساب رئيسي)',
    description: 'توريد دفعة حديد تسليح أقطار 16 مم و 12 مم لأعمال أعمدة الطابق الثامن',
    notes: 'شهادة المنشأ والاختبارات مطابقة للمواصفات القياسية',
    created_at: '2025-02-08T10:00:00.000Z',
    created_by_name: 'المهندس أحمد الشرقاوي',
  },
  {
    id: 'exp-005',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    tower_id: 'tow-004',
    tower_name: 'البرج الإداري الرئيسي - العاصمة',
    category: 'permits_fees',
    category_ar: 'تراخيص ورسوم وتأمينات حكومية',
    amount: 650000,
    expense_date: '2025-01-25',
    invoice_number: 'GOV-NAC-1092',
    supplier_beneficiary: 'جهاز تنمية العاصمة الإدارية الجديدة',
    payment_method: 'bank_transfer',
    bank_account_id: 'bank-misr-02',
    bank_account_name: 'بنك مصر (حساب العاصمة)',
    description: 'سداد رسوم شبكات وتصاريح الحفر وتوصيل المرافق المؤقتة للموقع',
    notes: 'إيصال سداد رسمي صادر من الإدارة المالية لجهاز العاصمة',
    created_at: '2025-01-25T11:00:00.000Z',
    created_by_name: 'طارق عبد العزيز',
  },
  {
    id: 'exp-006',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    category: 'engineering_supervision',
    category_ar: 'إشراف هندسي وتصميم واستشارات',
    amount: 250000,
    expense_date: '2025-02-18',
    invoice_number: 'CNS-ENG-304',
    supplier_beneficiary: 'مكتب الدكتور استشاري الإنشاءات',
    payment_method: 'bank_transfer',
    bank_account_id: 'bank-nbe-01',
    bank_account_name: 'البنك الأهلي المصري (حساب رئيسي)',
    description: 'أتعاب الإشراف الموقعي والاختبارات الدورية عن شهر يناير وفبراير',
    notes: 'معتمد من إدارة المشروعات',
    created_at: '2025-02-18T13:40:00.000Z',
    created_by_name: 'حسام الدين ممدوح',
  }
];

export const INITIAL_UNITS: TowerUnit[] = [
  // Units for tow-001 (برج الياقوت A)
  {
    id: 'unt-101',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    unit_number: '101',
    floor_number: 1,
    unit_type: 'apartment',
    area_sqm: 165,
    selling_price: 3630000,
    status: 'sold',
    allocated_cost: 0,
    cost_per_sqm: 0,
    client_name: 'الأستاذ خالد عبد المنعم',
    notes: 'واجهة بحرية مطلة على الحديقة المركزية',
  },
  {
    id: 'unt-102',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    unit_number: '102',
    floor_number: 1,
    unit_type: 'apartment',
    area_sqm: 180,
    selling_price: 3960000,
    status: 'sold',
    allocated_cost: 0,
    cost_per_sqm: 0,
    client_name: 'الدكتور عصام الشريف',
    notes: 'شقة نموذج ب - 3 غرف نوم وريسبشن كبير',
  },
  {
    id: 'unt-103',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    unit_number: '201',
    floor_number: 2,
    unit_type: 'apartment',
    area_sqm: 195,
    selling_price: 4485000,
    status: 'reserved',
    allocated_cost: 0,
    cost_per_sqm: 0,
    client_name: 'المهندسة نادية رضوان',
    notes: 'مقدم حجز مدفوع وجارِ تحرير العقد',
  },
  {
    id: 'unt-104',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    unit_number: '202',
    floor_number: 2,
    unit_type: 'apartment',
    area_sqm: 155,
    selling_price: 3410000,
    status: 'available',
    allocated_cost: 0,
    cost_per_sqm: 0,
    notes: 'متاحة للبيع الفوري بأنظمة سداد حتى 6 سنوات',
  },
  {
    id: 'unt-105',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    unit_number: 'DUP-01',
    floor_number: 13,
    unit_type: 'duplex',
    area_sqm: 320,
    selling_price: 8320000,
    status: 'sold',
    allocated_cost: 0,
    cost_per_sqm: 0,
    client_name: 'رجل الأعمال حاتم الغندور',
    notes: 'دوبلكس فاخر بالرووف مع حمام سباحة خاص',
  },
  // Units for tow-004 (البرج الإداري بالعاصمة)
  {
    id: 'unt-201',
    tower_id: 'tow-004',
    tower_name: 'البرج الإداري الرئيسي - العاصمة',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    unit_number: 'OFF-301',
    floor_number: 3,
    unit_type: 'administrative_office',
    area_sqm: 120,
    selling_price: 8400000,
    status: 'sold',
    allocated_cost: 0,
    cost_per_sqm: 0,
    client_name: 'مجموعة الأهرام للاستثمار',
    notes: 'مكتب إداري مجهز بتكييف مركزي وتشطيب كامل',
  },
  {
    id: 'unt-202',
    tower_id: 'tow-004',
    tower_name: 'البرج الإداري الرئيسي - العاصمة',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    unit_number: 'SHP-G01',
    floor_number: 0,
    unit_type: 'commercial_shop',
    area_sqm: 85,
    selling_price: 11900000,
    status: 'reserved',
    allocated_cost: 0,
    cost_per_sqm: 0,
    client_name: 'شركة فرست كافيه',
    notes: 'محل تجاري بالدور الأرضي بواجهة على الميدان الرئيسي',
  }
];

export const INITIAL_CONTRACT_INSTALLMENTS: ContractInstallment[] = [
  // 1. كمبوند جوهرة التجمع السكني - برج الياقوت A
  {
    id: 'inst-001',
    contract_number: 'CTR-2024-041',
    client_name: 'الأستاذ خالد عبد المنعم',
    client_phone: '01099887766',
    client_national_id: '28501140102345',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    unit_id: 'unt-101',
    unit_number: '101',
    unit_area_sqm: 165,
    unit_type: 'apartment',
    total_unit_price: 3630000,
    paid_amount: 1452000,
    remaining_amount: 2178000,
    installment_title: 'قسط الربع الأول 2026',
    installment_number: 4,
    total_installments_count: 12,
    due_date: '2026-10-01',
    amount: 181500,
    status: 'pending',
  },
  {
    id: 'inst-002',
    contract_number: 'CTR-2024-041',
    client_name: 'الأستاذ خالد عبد المنعم',
    client_phone: '01099887766',
    client_national_id: '28501140102345',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    unit_id: 'unt-101',
    unit_number: '101',
    unit_area_sqm: 165,
    unit_type: 'apartment',
    total_unit_price: 3630000,
    paid_amount: 1452000,
    remaining_amount: 2178000,
    installment_title: 'قسط الربع الرابع 2025',
    installment_number: 3,
    total_installments_count: 12,
    due_date: '2025-12-01',
    amount: 181500,
    status: 'paid',
    payment_date: '2025-11-28',
    payment_method: 'bank_transfer',
  },
  {
    id: 'inst-003',
    contract_number: 'CTR-2024-055',
    client_name: 'الدكتور عصام الشريف',
    client_phone: '01122334499',
    client_national_id: '27908220101987',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    unit_id: 'unt-102',
    unit_number: '102',
    unit_area_sqm: 180,
    unit_type: 'apartment',
    total_unit_price: 3960000,
    paid_amount: 1188000,
    remaining_amount: 2772000,
    installment_title: 'قسط الربع الثالث 2026',
    installment_number: 5,
    total_installments_count: 16,
    due_date: '2026-08-15',
    amount: 173250,
    status: 'overdue',
  },
  {
    id: 'inst-004',
    contract_number: 'CTR-2024-072',
    client_name: 'رجل الأعمال حاتم الغندور',
    client_phone: '01221100998',
    client_national_id: '27204150100234',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    unit_id: 'unt-105',
    unit_number: 'DUP-01',
    unit_area_sqm: 320,
    unit_type: 'duplex',
    total_unit_price: 8320000,
    paid_amount: 4160000,
    remaining_amount: 4160000,
    installment_title: 'دفعة صب السقف الأخير للبرج',
    installment_number: 3,
    total_installments_count: 8,
    due_date: '2026-09-28',
    amount: 520000,
    status: 'pending',
  },
  {
    id: 'inst-004-ovd',
    contract_number: 'CTR-2024-072',
    client_name: 'رجل الأعمال حاتم الغندور',
    client_phone: '01221100998',
    client_national_id: '27204150100234',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-001',
    tower_name: 'برج الياقوت A',
    unit_id: 'unt-105',
    unit_number: 'DUP-01',
    unit_area_sqm: 320,
    unit_type: 'duplex',
    total_unit_price: 8320000,
    paid_amount: 4160000,
    remaining_amount: 4160000,
    installment_title: 'دفعة استكمال الواجهات الخارجية',
    installment_number: 2,
    total_installments_count: 8,
    due_date: '2026-06-30',
    amount: 520000,
    status: 'overdue',
  },

  // 2. كمبوند جوهرة التجمع السكني - برج الزمرد B
  {
    id: 'inst-006',
    contract_number: 'CTR-2024-083',
    client_name: 'المهندس شريف سالم رضوان',
    client_phone: '01014567890',
    client_national_id: '28309100104567',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-002',
    tower_name: 'برج الزمرد B',
    unit_id: 'unt-108',
    unit_number: '204',
    unit_area_sqm: 175,
    unit_type: 'apartment',
    total_unit_price: 3850000,
    paid_amount: 1540000,
    remaining_amount: 2310000,
    installment_title: 'قسط الربع الثالث 2026',
    installment_number: 4,
    total_installments_count: 12,
    due_date: '2026-09-10',
    amount: 192500,
    status: 'overdue',
  },
  {
    id: 'inst-007',
    contract_number: 'CTR-2024-083',
    client_name: 'المهندس شريف سالم رضوان',
    client_phone: '01014567890',
    client_national_id: '28309100104567',
    project_id: 'proj-001',
    project_name: 'كمبوند جوهرة التجمع السكني',
    tower_id: 'tow-002',
    tower_name: 'برج الزمرد B',
    unit_id: 'unt-108',
    unit_number: '204',
    unit_area_sqm: 175,
    unit_type: 'apartment',
    total_unit_price: 3850000,
    paid_amount: 1540000,
    remaining_amount: 2310000,
    installment_title: 'قسط الربع الرابع 2026',
    installment_number: 5,
    total_installments_count: 12,
    due_date: '2026-12-10',
    amount: 192500,
    status: 'pending',
  },

  // 3. برج العاصمة الإدارية للأعمال - البرج الإداري الرئيسي
  {
    id: 'inst-005',
    contract_number: 'CTR-2024-098',
    client_name: 'مجموعة الأهرام للاستثمار والتجارة',
    client_phone: '01002233441',
    client_national_id: '1092837465',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    tower_id: 'tow-004',
    tower_name: 'البرج الإداري الرئيسي - العاصمة',
    unit_id: 'unt-201',
    unit_number: 'OFF-301',
    unit_area_sqm: 120,
    unit_type: 'administrative_office',
    total_unit_price: 8400000,
    paid_amount: 3360000,
    remaining_amount: 5040000,
    installment_title: 'قسط الربع الثالث 2026',
    installment_number: 4,
    total_installments_count: 10,
    due_date: '2026-09-15',
    amount: 504000,
    status: 'overdue',
  },
  {
    id: 'inst-008',
    contract_number: 'CTR-2024-098',
    client_name: 'مجموعة الأهرام للاستثمار والتجارة',
    client_phone: '01002233441',
    client_national_id: '1092837465',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    tower_id: 'tow-004',
    tower_name: 'البرج الإداري الرئيسي - العاصمة',
    unit_id: 'unt-201',
    unit_number: 'OFF-301',
    unit_area_sqm: 120,
    unit_type: 'administrative_office',
    total_unit_price: 8400000,
    paid_amount: 3360000,
    remaining_amount: 5040000,
    installment_title: 'قسط الربع الرابع 2026',
    installment_number: 5,
    total_installments_count: 10,
    due_date: '2026-11-15',
    amount: 504000,
    status: 'pending',
  },
  {
    id: 'inst-009',
    contract_number: 'CTR-2024-115',
    client_name: 'شركة فرست كافيه والتوكيلات العالمية',
    client_phone: '01288990011',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    tower_id: 'tow-004',
    tower_name: 'البرج الإداري الرئيسي - العاصمة',
    unit_id: 'unt-202',
    unit_number: 'SHP-G01',
    unit_area_sqm: 85,
    unit_type: 'commercial_shop',
    total_unit_price: 11900000,
    paid_amount: 4760000,
    remaining_amount: 7140000,
    installment_title: 'دفعة استلام رخصة التشغيل',
    installment_number: 3,
    total_installments_count: 8,
    due_date: '2026-10-15',
    amount: 892500,
    status: 'pending',
  },
  {
    id: 'inst-009-ovd',
    contract_number: 'CTR-2024-115',
    client_name: 'شركة فرست كافيه والتوكيلات العالمية',
    client_phone: '01288990011',
    project_id: 'proj-002',
    project_name: 'برج العاصمة الإدارية للأعمال',
    tower_id: 'tow-004',
    tower_name: 'البرج الإداري الرئيسي - العاصمة',
    unit_id: 'unt-202',
    unit_number: 'SHP-G01',
    unit_area_sqm: 85,
    unit_type: 'commercial_shop',
    total_unit_price: 11900000,
    paid_amount: 4760000,
    remaining_amount: 7140000,
    installment_title: 'قسط الربع الثاني 2026',
    installment_number: 2,
    total_installments_count: 8,
    due_date: '2026-05-20',
    amount: 892500,
    status: 'overdue',
  },

  // 4. مجمع واحة زايد الطبي والإداري - مبنى العيادات التخصصية
  {
    id: 'inst-010',
    contract_number: 'CTR-2024-142',
    client_name: 'الدكتور حازم توفيق المنشاوي',
    client_phone: '01155443322',
    client_national_id: '27806120101567',
    project_id: 'proj-003',
    project_name: 'مجمع واحة زايد الطبي والإداري',
    tower_id: 'tow-005',
    tower_name: 'مبنى العيادات التخصصية',
    unit_id: 'unt-301',
    unit_number: 'CLN-205',
    unit_area_sqm: 95,
    unit_type: 'clinic',
    total_unit_price: 5225000,
    paid_amount: 2090000,
    remaining_amount: 3135000,
    installment_title: 'قسط شهر يوليو 2026',
    installment_number: 6,
    total_installments_count: 14,
    due_date: '2026-07-25',
    amount: 223900,
    status: 'overdue',
  },
  {
    id: 'inst-011',
    contract_number: 'CTR-2024-142',
    client_name: 'الدكتور حازم توفيق المنشاوي',
    client_phone: '01155443322',
    client_national_id: '27806120101567',
    project_id: 'proj-003',
    project_name: 'مجمع واحة زايد الطبي والإداري',
    tower_id: 'tow-005',
    tower_name: 'مبنى العيادات التخصصية',
    unit_id: 'unt-301',
    unit_number: 'CLN-205',
    unit_area_sqm: 95,
    unit_type: 'clinic',
    total_unit_price: 5225000,
    paid_amount: 2090000,
    remaining_amount: 3135000,
    installment_title: 'قسط شهر أكتوبر 2026',
    installment_number: 7,
    total_installments_count: 14,
    due_date: '2026-10-25',
    amount: 223900,
    status: 'pending',
  },
  {
    id: 'inst-012',
    contract_number: 'CTR-2024-160',
    client_name: 'مختبرات الحياة للتحاليل الطبية',
    client_phone: '01055667788',
    project_id: 'proj-003',
    project_name: 'مجمع واحة زايد الطبي والإداري',
    tower_id: 'tow-005',
    tower_name: 'مبنى العيادات التخصصية',
    unit_id: 'unt-302',
    unit_number: 'LAB-102',
    unit_area_sqm: 140,
    unit_type: 'clinic',
    total_unit_price: 7700000,
    paid_amount: 3850000,
    remaining_amount: 3850000,
    installment_title: 'دفعة تسليم المحارة والمصاعد الطبية',
    installment_number: 4,
    total_installments_count: 8,
    due_date: '2026-09-25',
    amount: 481250,
    status: 'pending',
  },

  // 5. أبراج كورنيش المعادي السكنية - برج النيل البانورامي
  {
    id: 'inst-013',
    contract_number: 'CTR-2023-018',
    client_name: 'المستشار سامح جلال الدسوقي',
    client_phone: '01200112233',
    client_national_id: '26512010103456',
    project_id: 'proj-005',
    project_name: 'أبراج كورنيش المعادي السكنية',
    tower_id: 'tow-006',
    tower_name: 'برج النيل البانورامي',
    unit_id: 'unt-401',
    unit_number: '1802',
    unit_area_sqm: 240,
    unit_type: 'penthouse',
    total_unit_price: 13200000,
    paid_amount: 11880000,
    remaining_amount: 1320000,
    installment_title: 'قسط الصيانة ووديعة الخدمات النهائية',
    installment_number: 8,
    total_installments_count: 8,
    due_date: '2026-08-30',
    amount: 330000,
    status: 'overdue',
  },
  {
    id: 'inst-014',
    contract_number: 'CTR-2023-018',
    client_name: 'المستشار سامح جلال الدسوقي',
    client_phone: '01200112233',
    client_national_id: '26512010103456',
    project_id: 'proj-005',
    project_name: 'أبراج كورنيش المعادي السكنية',
    tower_id: 'tow-006',
    tower_name: 'برج النيل البانورامي',
    unit_id: 'unt-401',
    unit_number: '1802',
    unit_area_sqm: 240,
    unit_type: 'penthouse',
    total_unit_price: 13200000,
    paid_amount: 11880000,
    remaining_amount: 1320000,
    installment_title: 'قسط التسليم النهائي لشهادة الملكية',
    installment_number: 7,
    total_installments_count: 8,
    due_date: '2026-04-15',
    amount: 330000,
    status: 'paid',
    payment_date: '2026-04-12',
    payment_method: 'cheque',
  },
  {
    id: 'inst-015',
    contract_number: 'CTR-2024-205',
    client_name: 'الأستاذة مروة فاروق عبد الحميد',
    client_phone: '01077889900',
    client_national_id: '28804050102789',
    project_id: 'proj-005',
    project_name: 'أبراج كورنيش المعادي السكنية',
    tower_id: 'tow-006',
    tower_name: 'برج النيل البانورامي',
    unit_id: 'unt-402',
    unit_number: '1201',
    unit_area_sqm: 190,
    unit_type: 'apartment',
    total_unit_price: 9500000,
    paid_amount: 4750000,
    remaining_amount: 4750000,
    installment_title: 'قسط الربع الرابع 2026',
    installment_number: 5,
    total_installments_count: 10,
    due_date: '2026-11-30',
    amount: 475000,
    status: 'pending',
  }
];

export const INITIAL_PAYMENT_RECEIPTS: InstallmentPaymentReceipt[] = [
  {
    id: 'rcp-001',
    receipt_number: 'RCP-2024-00142',
    installment_id: 'inst-002',
    contract_number: 'CTR-2024-041',
    client_name: 'الأستاذ خالد عبد المنعم',
    amount: 181500,
    payment_date: '2024-11-28',
    payment_method: 'bank_transfer',
    bank_account_id: 'bank-nbe-01',
    bank_account_name: 'البنك الأهلي المصري (NBE)',
    transfer_reference: 'TRF-NBE-9948271',
    notes: 'سداد قسط الربع الرابع تم عبر تحويل بنكي على حساب البنك الأهلي',
    created_at: '2024-11-28T14:00:00.000Z',
    created_by_name: 'محمود إبراهيم (المحاسب)',
  },
  {
    id: 'rcp-002',
    receipt_number: 'RCP-2025-00018',
    installment_id: 'inst-custom-01',
    contract_number: 'CTR-2024-055',
    client_name: 'الدكتور عصام الشريف',
    amount: 250000,
    payment_date: '2025-01-10',
    payment_method: 'cheque',
    bank_account_id: 'bank-misr-02',
    bank_account_name: 'بنك مصر (حساب العاصمة)',
    cheque_number: 'CHQ-883921',
    cheque_bank_name: 'بنك الإسكندرية',
    cheque_due_date: '2025-01-30',
    cheque_status: 'cleared',
    notes: 'تم تحصيل الشيك وإيداع القيمة في حساب بنك مصر بنجاح',
    created_at: '2025-01-10T11:30:00.000Z',
    created_by_name: 'محمود إبراهيم',
  },
  {
    id: 'rcp-003',
    receipt_number: 'RCP-2025-00045',
    installment_id: 'inst-custom-02',
    contract_number: 'CTR-2024-072',
    client_name: 'رجل الأعمال حاتم الغندور',
    amount: 1000000,
    payment_date: '2025-02-01',
    payment_method: 'cheque',
    bank_account_id: 'bank-nbe-01',
    bank_account_name: 'البنك الأهلي المصري (NBE)',
    cheque_number: 'CHQ-449102',
    cheque_bank_name: 'بنك قطر الوطني الأهلي QNB',
    cheque_due_date: '2025-03-10',
    cheque_status: 'under_collection',
    notes: 'شيك بنكي تحت التحصيل برسم الإيداع في تاريخ الاستحقاق',
    created_at: '2025-02-01T15:00:00.000Z',
    created_by_name: 'محمود إبراهيم',
  }
];

export const INITIAL_BANK_TRANSACTIONS: BankTransaction[] = [
  {
    id: 'btx-001',
    account_id: 'bank-nbe-01',
    account_name: 'البنك الأهلي المصري (حساب رئيسي)',
    transaction_type: 'deposit',
    amount: 181500,
    transaction_date: '2024-11-28',
    reference_number: 'TRF-NBE-9948271',
    description: 'تحصيل قسط العقد CTR-2024-041 - الأستاذ خالد عبد المنعم',
    category: 'installment_payment',
    balance_after: 14850000,
    created_at: '2024-11-28T14:00:00.000Z',
  },
  {
    id: 'btx-002',
    account_id: 'bank-nbe-01',
    account_name: 'البنك الأهلي المصري (حساب رئيسي)',
    transaction_type: 'withdrawal',
    amount: 1450000,
    transaction_date: '2025-02-05',
    reference_number: 'INV-CEM-902',
    description: 'سداد قيمة خرسانة جاهزة لسقف برج الياقوت A - شركة مصر للخرسانة',
    category: 'expense_payout',
    balance_after: 13400000,
    created_at: '2025-02-05T12:00:00.000Z',
  },
  {
    id: 'btx-003',
    account_id: 'bank-misr-02',
    account_name: 'بنك مصر (حساب العاصمة)',
    transaction_type: 'deposit',
    amount: 250000,
    transaction_date: '2025-01-30',
    reference_number: 'CHQ-883921',
    description: 'تحصيل شيك بنكي رقم 883921 - الدكتور عصام الشريف',
    category: 'installment_payment',
    balance_after: 9200000,
    created_at: '2025-01-30T10:00:00.000Z',
  }
];

// Ensure local persistence initialization
export const initializeFinancialStorage = () => {
  if (!localStorage.getItem(`${STORAGE_PREFIX}bank_accounts`)) {
    setLocal('bank_accounts', INITIAL_BANK_ACCOUNTS);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}warehouses`)) {
    setLocal('warehouses', INITIAL_WAREHOUSES);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}material_items`)) {
    setLocal('material_items', INITIAL_MATERIAL_ITEMS);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}inventory_transactions`)) {
    setLocal('inventory_transactions', INITIAL_INVENTORY_TXS);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}expenses`)) {
    setLocal('expenses', INITIAL_EXPENSES);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}tower_units`)) {
    setLocal('tower_units', INITIAL_UNITS);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}contract_installments`)) {
    setLocal('contract_installments', INITIAL_CONTRACT_INSTALLMENTS);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}payment_receipts`)) {
    setLocal('payment_receipts', INITIAL_PAYMENT_RECEIPTS);
  }
  if (!localStorage.getItem(`${STORAGE_PREFIX}bank_transactions`)) {
    setLocal('bank_transactions', INITIAL_BANK_TRANSACTIONS);
  }
};

// ============================================================================
// FINANCIAL & INVENTORY SERVICE
// ============================================================================

export const financialService = {
  // --------------------------------------------------------------------------
  // 1. EXPENSES & COSTS
  // --------------------------------------------------------------------------
  async getExpenses(): Promise<Expense[]> {
    initializeFinancialStorage();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
        if (!error && data && data.length > 0) return data as Expense[];
      } catch (e) {
        console.warn('Falling back to local storage for expenses', e);
      }
    }
    return getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
  },

  async addExpense(
    expense: Omit<Expense, 'id' | 'created_at'>, 
    currentUser: { id: string; full_name: string }
  ): Promise<Expense> {
    initializeFinancialStorage();
    const newExpense: Expense = {
      ...expense,
      id: 'exp-' + Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      created_by_id: currentUser.id,
      created_by_name: currentUser.full_name,
    };

    // If paid from a bank account or cashbox, deduct balance and record bank transaction
    if (expense.bank_account_id) {
      await this.withdrawFromAccount(
        expense.bank_account_id, 
        expense.amount, 
        `صرف مصروف بند (${expense.category_ar || expense.category}) - ${expense.tower_name || 'برج'} - ${expense.description}`,
        expense.invoice_number,
        'expense_payout'
      );
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('expenses').insert([newExpense]);
      } catch (e) {
        console.warn('Supabase insert failed, saving locally', e);
      }
    }

    const current = getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
    setLocal('expenses', [newExpense, ...current]);

    // Log Activity
    await dataService.logActivity(
      currentUser,
      'create',
      'costs',
      `تم قيد مصروف بمبلغ ${expense.amount.toLocaleString()} ج.م على ${expense.tower_name || 'البرج'}: ${expense.description}`,
      newExpense.id
    );

    return newExpense;
  },

  async deleteExpense(id: string, currentUser: { id: string; full_name: string }): Promise<void> {
    initializeFinancialStorage();
    const current = getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
    const exp = current.find((e) => e.id === id);
    const filtered = current.filter((e) => e.id !== id);
    setLocal('expenses', filtered);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('expenses').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase delete expense error', e);
      }
    }

    if (exp) {
      await dataService.logActivity(
        currentUser,
        'delete',
        'costs',
        `تم حذف المصروف رقم ${id} المقيد على ${exp.tower_name} بمبلغ ${exp.amount.toLocaleString()} ج.م`,
        id
      );
    }
  },

  // --------------------------------------------------------------------------
  // 2. TOWER UNITS & COST ALLOCATION
  // --------------------------------------------------------------------------
  async getUnits(): Promise<TowerUnit[]> {
    initializeFinancialStorage();
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('tower_units').select('*').order('unit_number', { ascending: true });
        if (!error && data && data.length > 0) return data as TowerUnit[];
      } catch (e) {
        console.warn('Falling back to local storage for tower units', e);
      }
    }
    return getLocal<TowerUnit[]>('tower_units', INITIAL_UNITS);
  },

  async getUnitsByTower(towerId: string): Promise<TowerUnit[]> {
    const all = await this.getUnits();
    return all.filter((u) => u.tower_id === towerId);
  },

  async addUnit(unit: Omit<TowerUnit, 'id'>, currentUser: { id: string; full_name: string }): Promise<TowerUnit> {
    initializeFinancialStorage();
    const newUnit: TowerUnit = {
      ...unit,
      id: 'unt-' + Math.random().toString(36).substring(2, 9),
      allocated_cost: 0,
      cost_per_sqm: 0,
      updated_at: new Date().toISOString(),
    };

    const current = getLocal<TowerUnit[]>('tower_units', INITIAL_UNITS);
    setLocal('tower_units', [...current, newUnit]);

    await dataService.logActivity(
      currentUser,
      'create',
      'towers',
      `تمت إضافة وحدة جديدة رقم ${newUnit.unit_number} في ${newUnit.tower_name}`,
      newUnit.id
    );

    return newUnit;
  },

  async updateUnit(id: string, updates: Partial<TowerUnit>, currentUser: { id: string; full_name: string }): Promise<TowerUnit> {
    initializeFinancialStorage();
    const current = getLocal<TowerUnit[]>('tower_units', INITIAL_UNITS);
    const index = current.findIndex((u) => u.id === id);
    if (index === -1) throw new Error('الوحدة غير موجودة');

    const updated = {
      ...current[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    current[index] = updated;
    setLocal('tower_units', current);

    return updated;
  },

  /**
   * Distribute total tower expenses onto all units of that tower based on area (m²)
   */
  async allocateTowerCostsToUnits(
    towerId: string, 
    currentUser: { id: string; full_name: string }
  ): Promise<{ towerName: string; totalCost: number; totalArea: number; costPerSqm: number; updatedUnitsCount: number }> {
    initializeFinancialStorage();
    const allExpenses = await this.getExpenses();
    const towerExpenses = allExpenses.filter((e) => e.tower_id === towerId);
    const totalCost = towerExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const allUnits = await this.getUnits();
    const towerUnits = allUnits.filter((u) => u.tower_id === towerId);

    if (towerUnits.length === 0) {
      throw new Error('لا توجد وحدات مسجلة لهذا البرج لتوزيع التكاليف عليها.');
    }

    const totalArea = towerUnits.reduce((sum, u) => sum + Number(u.area_sqm || 0), 0);
    if (totalArea <= 0) {
      throw new Error('إجمالي مساحة وحدات البرج غير صالحة للقسمة.');
    }

    const costPerSqm = Math.round(totalCost / totalArea);

    const updatedAllUnits = allUnits.map((u) => {
      if (u.tower_id === towerId) {
        const unitArea = Number(u.area_sqm || 0);
        const allocatedCost = Math.round(unitArea * costPerSqm);
        return {
          ...u,
          allocated_cost: allocatedCost,
          cost_per_sqm: costPerSqm,
          updated_at: new Date().toISOString(),
        };
      }
      return u;
    });

    setLocal('tower_units', updatedAllUnits);

    const towerName = towerUnits[0]?.tower_name || 'البرج';

    await dataService.logActivity(
      currentUser,
      'update',
      'costs',
      `تم توزيع إجمالي تكاليف ${towerName} البالغة ${totalCost.toLocaleString()} ج.م على ${towerUnits.length} وحدة بمعدل ${costPerSqm.toLocaleString()} ج.م/م²`,
      towerId
    );

    return {
      towerName,
      totalCost,
      totalArea,
      costPerSqm,
      updatedUnitsCount: towerUnits.length,
    };
  },

  // --------------------------------------------------------------------------
  // 3. WAREHOUSES & RAW MATERIALS INVENTORY
  // --------------------------------------------------------------------------
  async getWarehouses(): Promise<Warehouse[]> {
    initializeFinancialStorage();
    return getLocal<Warehouse[]>('warehouses', INITIAL_WAREHOUSES);
  },

  async getMaterialItems(): Promise<MaterialItem[]> {
    initializeFinancialStorage();
    return getLocal<MaterialItem[]>('material_items', INITIAL_MATERIAL_ITEMS);
  },

  async addMaterialItem(
    item: Omit<MaterialItem, 'id' | 'current_quantity'>, 
    initialQty = 0,
    currentUser: { id: string; full_name: string }
  ): Promise<MaterialItem> {
    initializeFinancialStorage();
    const newItem: MaterialItem = {
      ...item,
      id: 'mat-' + Math.random().toString(36).substring(2, 9),
      current_quantity: initialQty,
      last_received_at: new Date().toISOString(),
    };

    const current = getLocal<MaterialItem[]>('material_items', INITIAL_MATERIAL_ITEMS);
    setLocal('material_items', [...current, newItem]);

    await dataService.logActivity(
      currentUser,
      'create',
      'inventory',
      `تم تعريف صنف مواد خام جديد: ${newItem.name} (${newItem.code}) في مستودع ${newItem.warehouse_name}`,
      newItem.id
    );

    return newItem;
  },

  async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    initializeFinancialStorage();
    return getLocal<InventoryTransaction[]>('inventory_transactions', INITIAL_INVENTORY_TXS);
  },

  /**
   * إذن إضافة توريد خامات للمخزن
   */
  async addInwardInventoryReceipt(
    data: {
      item_id: string;
      warehouse_id: string;
      quantity: number;
      unit_price: number;
      document_number: string;
      supplier_name: string;
      transaction_date: string;
      notes?: string;
    },
    currentUser: { id: string; full_name: string }
  ): Promise<InventoryTransaction> {
    initializeFinancialStorage();
    const items = getLocal<MaterialItem[]>('material_items', INITIAL_MATERIAL_ITEMS);
    const itemIndex = items.findIndex((i) => i.id === data.item_id);
    if (itemIndex === -1) throw new Error('صنف المادة الخام غير موجود.');

    const item = items[itemIndex];
    const warehouses = getLocal<Warehouse[]>('warehouses', INITIAL_WAREHOUSES);
    const warehouse = warehouses.find((w) => w.id === data.warehouse_id) || { name: item.warehouse_name || 'المستودع' };

    const totalCost = Number(data.quantity) * Number(data.unit_price);

    // Calculate moving average cost
    const existingQty = Number(item.current_quantity || 0);
    const existingCost = existingQty * Number(item.avg_unit_cost || 0);
    const newTotalQty = existingQty + Number(data.quantity);
    const newAvgCost = newTotalQty > 0 ? Math.round((existingCost + totalCost) / newTotalQty) : data.unit_price;

    // Update item stock
    items[itemIndex] = {
      ...item,
      current_quantity: newTotalQty,
      avg_unit_cost: newAvgCost,
      last_received_at: new Date().toISOString(),
    };
    setLocal('material_items', items);

    // Create transaction record
    const newTx: InventoryTransaction = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      transaction_type: 'inward',
      item_id: item.id,
      item_name: item.name,
      item_code: item.code,
      warehouse_id: data.warehouse_id,
      warehouse_name: warehouse.name,
      quantity: Number(data.quantity),
      unit_price: Number(data.unit_price),
      total_cost: totalCost,
      transaction_date: data.transaction_date,
      document_number: data.document_number,
      supplier_name: data.supplier_name,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    const currentTxs = getLocal<InventoryTransaction[]>('inventory_transactions', INITIAL_INVENTORY_TXS);
    setLocal('inventory_transactions', [newTx, ...currentTxs]);

    // Log Activity
    await dataService.logActivity(
      currentUser,
      'create',
      'inventory',
      `إذن إضافة خامات رقم ${data.document_number}: توريد ${data.quantity} ${item.unit} من ${item.name} من المورد ${data.supplier_name}`,
      newTx.id
    );

    return newTx;
  },

  /**
   * إذن صرف خامات من المخزن على برج محدد تحت التنفيذ
   * وربط التكلفة تلقائياً بمصروفات وتكاليف البرج
   */
  async addOutwardIssueToTower(
    data: {
      item_id: string;
      warehouse_id: string;
      quantity: number;
      project_id: string;
      project_name: string;
      tower_id: string;
      tower_name: string;
      document_number: string;
      engineer_recipient: string;
      transaction_date: string;
      notes?: string;
    },
    currentUser: { id: string; full_name: string }
  ): Promise<{ transaction: InventoryTransaction; expense: Expense }> {
    initializeFinancialStorage();
    const items = getLocal<MaterialItem[]>('material_items', INITIAL_MATERIAL_ITEMS);
    const itemIndex = items.findIndex((i) => i.id === data.item_id);
    if (itemIndex === -1) throw new Error('صنف المادة الخام غير موجود.');

    const item = items[itemIndex];
    if (item.current_quantity < Number(data.quantity)) {
      throw new Error(`الكمية المطلوبة (${data.quantity} ${item.unit}) تتجاوز الرصيد الحالي المتوفر بالمخزن (${item.current_quantity} ${item.unit}).`);
    }

    const warehouses = getLocal<Warehouse[]>('warehouses', INITIAL_WAREHOUSES);
    const warehouse = warehouses.find((w) => w.id === data.warehouse_id) || { name: item.warehouse_name || 'المستودع' };

    const unitPrice = item.avg_unit_cost || 0;
    const totalCost = Number(data.quantity) * unitPrice;

    // Deduct quantity from warehouse item
    items[itemIndex] = {
      ...item,
      current_quantity: item.current_quantity - Number(data.quantity),
    };
    setLocal('material_items', items);

    // 1. Create Outward Inventory Transaction
    const newTx: InventoryTransaction = {
      id: 'tx-' + Math.random().toString(36).substring(2, 9),
      transaction_type: 'outward',
      item_id: item.id,
      item_name: item.name,
      item_code: item.code,
      warehouse_id: data.warehouse_id,
      warehouse_name: warehouse.name,
      quantity: Number(data.quantity),
      unit_price: unitPrice,
      total_cost: totalCost,
      transaction_date: data.transaction_date,
      document_number: data.document_number,
      project_id: data.project_id,
      project_name: data.project_name,
      tower_id: data.tower_id,
      tower_name: data.tower_name,
      engineer_recipient: data.engineer_recipient,
      notes: data.notes,
      created_at: new Date().toISOString(),
    };

    const currentTxs = getLocal<InventoryTransaction[]>('inventory_transactions', INITIAL_INVENTORY_TXS);
    setLocal('inventory_transactions', [newTx, ...currentTxs]);

    // 2. AUTOMATICALLY create an expense on the target tower under "building_materials"
    const newExpense: Expense = {
      id: 'exp-mat-' + Math.random().toString(36).substring(2, 9),
      project_id: data.project_id,
      project_name: data.project_name,
      tower_id: data.tower_id,
      tower_name: data.tower_name,
      category: 'building_materials',
      category_ar: 'مواد بناء وتوريدات خرسانية',
      amount: totalCost,
      expense_date: data.transaction_date,
      invoice_number: data.document_number,
      supplier_beneficiary: `صرف مخزني: ${warehouse.name}`,
      payment_method: 'cash',
      description: `صرف ${data.quantity} ${item.unit} من (${item.name}) للبرج تحت إشراف المهندس: ${data.engineer_recipient}`,
      notes: data.notes,
      created_at: new Date().toISOString(),
      created_by_name: currentUser.full_name,
    };

    const currentExpenses = getLocal<Expense[]>('expenses', INITIAL_EXPENSES);
    setLocal('expenses', [newExpense, ...currentExpenses]);

    // Log Activity
    await dataService.logActivity(
      currentUser,
      'create',
      'inventory',
      `إذن صرف خامات رقم ${data.document_number}: صرف ${data.quantity} ${item.unit} (${item.name}) إلى ${data.tower_name} بقيمة ${totalCost.toLocaleString()} ج.م تم قيدها بمصروفات البرج.`,
      newTx.id
    );

    return { transaction: newTx, expense: newExpense };
  },

  // --------------------------------------------------------------------------
  // 4. BANKING, TREASURY & BANK TRANSACTIONS
  // --------------------------------------------------------------------------
  async getBankAccounts(): Promise<BankAccount[]> {
    initializeFinancialStorage();
    return getLocal<BankAccount[]>('bank_accounts', INITIAL_BANK_ACCOUNTS);
  },

  async addBankAccount(
    account: Omit<BankAccount, 'id' | 'is_active'>, 
    currentUser: { id: string; full_name: string }
  ): Promise<BankAccount> {
    initializeFinancialStorage();
    const newAccount: BankAccount = {
      ...account,
      id: 'bank-' + Math.random().toString(36).substring(2, 9),
      is_active: true,
    };

    const current = getLocal<BankAccount[]>('bank_accounts', INITIAL_BANK_ACCOUNTS);
    setLocal('bank_accounts', [...current, newAccount]);

    await dataService.logActivity(
      currentUser,
      'create',
      'banking',
      `تمت إضافة حساب بنكي جديد: ${newAccount.bank_name} - ${newAccount.account_name} برصيد ابتدائي ${newAccount.balance.toLocaleString()} ج.م`,
      newAccount.id
    );

    return newAccount;
  },

  async getBankTransactions(): Promise<BankTransaction[]> {
    initializeFinancialStorage();
    return getLocal<BankTransaction[]>('bank_transactions', INITIAL_BANK_TRANSACTIONS);
  },

  async depositToAccount(
    accountId: string, 
    amount: number, 
    description: string, 
    refNumber?: string,
    category: 'installment_payment' | 'expense_payout' | 'transfer' | 'other' = 'installment_payment'
  ): Promise<void> {
    initializeFinancialStorage();
    const accounts = getLocal<BankAccount[]>('bank_accounts', INITIAL_BANK_ACCOUNTS);
    const accIndex = accounts.findIndex((a) => a.id === accountId);
    if (accIndex === -1) return;

    const acc = accounts[accIndex];
    const newBalance = Number(acc.balance) + Number(amount);
    accounts[accIndex] = { ...acc, balance: newBalance };
    setLocal('bank_accounts', accounts);

    // Record bank transaction
    const newBtx: BankTransaction = {
      id: 'btx-' + Math.random().toString(36).substring(2, 9),
      account_id: acc.id,
      account_name: `${acc.bank_name} (${acc.account_name})`,
      transaction_type: 'deposit',
      amount: Number(amount),
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: refNumber,
      description,
      category,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    };

    const currentBtxs = getLocal<BankTransaction[]>('bank_transactions', INITIAL_BANK_TRANSACTIONS);
    setLocal('bank_transactions', [newBtx, ...currentBtxs]);
  },

  async withdrawFromAccount(
    accountId: string, 
    amount: number, 
    description: string, 
    refNumber?: string,
    category: 'installment_payment' | 'expense_payout' | 'transfer' | 'other' = 'expense_payout'
  ): Promise<void> {
    initializeFinancialStorage();
    const accounts = getLocal<BankAccount[]>('bank_accounts', INITIAL_BANK_ACCOUNTS);
    const accIndex = accounts.findIndex((a) => a.id === accountId);
    if (accIndex === -1) return;

    const acc = accounts[accIndex];
    const newBalance = Number(acc.balance) - Number(amount);
    accounts[accIndex] = { ...acc, balance: newBalance };
    setLocal('bank_accounts', accounts);

    // Record bank transaction
    const newBtx: BankTransaction = {
      id: 'btx-' + Math.random().toString(36).substring(2, 9),
      account_id: acc.id,
      account_name: `${acc.bank_name} (${acc.account_name})`,
      transaction_type: 'withdrawal',
      amount: Number(amount),
      transaction_date: new Date().toISOString().split('T')[0],
      reference_number: refNumber,
      description,
      category,
      balance_after: newBalance,
      created_at: new Date().toISOString(),
    };

    const currentBtxs = getLocal<BankTransaction[]>('bank_transactions', INITIAL_BANK_TRANSACTIONS);
    setLocal('bank_transactions', [newBtx, ...currentBtxs]);
  },

  // --------------------------------------------------------------------------
  // 5. INSTALLMENTS & PAYMENT RECEIPTS
  // --------------------------------------------------------------------------
  async getContractInstallments(): Promise<ContractInstallment[]> {
    initializeFinancialStorage();
    return getLocal<ContractInstallment[]>('contract_installments', INITIAL_CONTRACT_INSTALLMENTS);
  },

  async getPaymentReceipts(): Promise<InstallmentPaymentReceipt[]> {
    initializeFinancialStorage();
    return getLocal<InstallmentPaymentReceipt[]>('payment_receipts', INITIAL_PAYMENT_RECEIPTS);
  },

  /**
   * تحصيل قسط نقدي أو تحويل بنكي أو شيك وربطه بالحسابات البنكية
   */
  async collectInstallmentPayment(
    data: {
      installment_id: string;
      amount?: number;
      amount_paid?: number;
      payment_date: string;
      payment_method: 'cash' | 'bank_transfer' | 'cheque';
      bank_account_id: string;
      transfer_reference?: string;
      transfer_reference_number?: string;
      cheque_number?: string;
      cheque_bank_name?: string;
      cheque_due_date?: string;
      cheque_status?: string;
      receipt_number?: string;
      notes?: string;
    },
    currentUser: { id: string; full_name: string }
  ): Promise<InstallmentPaymentReceipt> {
    initializeFinancialStorage();
    const installments = getLocal<ContractInstallment[]>('contract_installments', INITIAL_CONTRACT_INSTALLMENTS);
    const instIndex = installments.findIndex((i) => i.id === data.installment_id);
    if (instIndex === -1) throw new Error('القسط غير موجود في النظام.');

    const installment = installments[instIndex];
    const accounts = getLocal<BankAccount[]>('bank_accounts', INITIAL_BANK_ACCOUNTS);
    const account = accounts.find((a) => a.id === data.bank_account_id) || { bank_name: 'الخزينة/البنك', account_name: '' };

    const paymentAmount = Number(data.amount ?? data.amount_paid ?? 0);
    const receiptNumber = data.receipt_number?.trim() || ('RCP-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000));

    const isCheque = data.payment_method === 'cheque';
    const chequeStatus = isCheque ? 'under_collection' : undefined;

    // 1. Create Receipt Record
    const receipt: InstallmentPaymentReceipt = {
      id: 'rcp-' + Math.random().toString(36).substring(2, 9),
      receipt_number: receiptNumber,
      installment_id: installment.id,
      contract_number: installment.contract_number,
      client_name: installment.client_name,
      project_name: installment.project_name,
      tower_name: installment.tower_name,
      unit_number: installment.unit_number,
      installment_title: installment.installment_title,
      amount: paymentAmount,
      amount_paid: paymentAmount,
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      bank_account_id: data.bank_account_id,
      bank_account_name: `${account.bank_name} - ${account.account_name}`,
      transfer_reference: data.transfer_reference || data.transfer_reference_number,
      transfer_reference_number: data.transfer_reference || data.transfer_reference_number,
      cheque_number: data.cheque_number,
      cheque_bank_name: data.cheque_bank_name,
      cheque_due_date: data.cheque_due_date,
      cheque_status: chequeStatus,
      notes: data.notes,
      created_at: new Date().toISOString(),
      created_by_name: currentUser.full_name,
      received_by_user_name: currentUser.full_name,
    };

    const receipts = getLocal<InstallmentPaymentReceipt[]>('payment_receipts', INITIAL_PAYMENT_RECEIPTS);
    setLocal('payment_receipts', [receipt, ...receipts]);

    // 2. If paid cash or bank transfer, instantly deposit into the bank/cashbox account!
    // If it's a cheque, it remains 'under_collection' until cleared.
    if (data.payment_method === 'cash' || data.payment_method === 'bank_transfer') {
      await this.depositToAccount(
        data.bank_account_id,
        paymentAmount,
        `تحصيل قسط العقد ${installment.contract_number} (${installment.installment_title}) - العميل ${installment.client_name}`,
        data.transfer_reference || data.transfer_reference_number || receiptNumber,
        'installment_payment'
      );
    }

    // 3. Update Installment Status & Paid Amount
    const newPaidAmount = Number(installment.paid_amount || 0) + paymentAmount;
    const newRemaining = Math.max(0, Number(installment.total_unit_price || 0) - newPaidAmount);

    installments[instIndex] = {
      ...installment,
      status: 'paid',
      payment_date: data.payment_date,
      payment_method: data.payment_method,
      paid_amount: newPaidAmount,
      remaining_amount: newRemaining,
    };
    setLocal('contract_installments', installments);

    // Log Activity
    await dataService.logActivity(
      currentUser,
      'create',
      'installments',
      `تم إصدار سند قبض رقم ${receiptNumber} بمبلغ ${paymentAmount.toLocaleString()} ج.م للعميل ${installment.client_name} طريقة السداد (${data.payment_method === 'cash' ? 'نقدي' : data.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'})`,
      receipt.id
    );

    return receipt;
  },

  /**
   * تحصيل الشيك وإيداعه في الحساب البنكي أو تعليمه كشيك مرتد
   */
  async updateChequeStatus(
    receiptId: string, 
    newStatus: 'cleared' | 'bounced',
    currentUser: { id: string; full_name: string }
  ): Promise<void> {
    initializeFinancialStorage();
    const receipts = getLocal<InstallmentPaymentReceipt[]>('payment_receipts', INITIAL_PAYMENT_RECEIPTS);
    const rIndex = receipts.findIndex((r) => r.id === receiptId);
    if (rIndex === -1) throw new Error('إيصال الشيك غير موجود.');

    const receipt = receipts[rIndex];
    if (receipt.cheque_status === 'cleared') {
      throw new Error('هذا الشيك تم تحصيله وإيداعه بالحساب البنكي بالفعل.');
    }

    receipts[rIndex] = {
      ...receipt,
      cheque_status: newStatus,
    };
    setLocal('payment_receipts', receipts);

    // If cleared, deposit into bank account
    if (newStatus === 'cleared') {
      await this.depositToAccount(
        receipt.bank_account_id,
        receipt.amount,
        `تحصيل الشيك البنكي رقم ${receipt.cheque_number || ''} للعميل ${receipt.client_name} - سند ${receipt.receipt_number}`,
        receipt.cheque_number,
        'installment_payment'
      );

      await dataService.logActivity(
        currentUser,
        'update',
        'banking',
        `تم تأكيد تحصيل الشيك رقم ${receipt.cheque_number} بمبلغ ${receipt.amount.toLocaleString()} ج.م وإيداعه في الحساب البنكي بنجاح.`,
        receipt.id
      );
    } else {
      await dataService.logActivity(
        currentUser,
        'update',
        'installments',
        `تم تسجيل ارتداد الشيك رقم ${receipt.cheque_number} للعميل ${receipt.client_name}.`,
        receipt.id
      );
    }
  },

  async getInstallments(): Promise<ContractInstallment[]> {
    return this.getContractInstallments();
  },

  async getReceipts(): Promise<InstallmentPaymentReceipt[]> {
    return this.getPaymentReceipts();
  },

  async clearCheque(receiptId: string, bankAccountIdOrUser: any, maybeUser?: any): Promise<void> {
    const user = maybeUser || (typeof bankAccountIdOrUser === 'object' && bankAccountIdOrUser !== null ? bankAccountIdOrUser : { id: 'admin', full_name: 'المحاسب المالي' });
    if (typeof bankAccountIdOrUser === 'string' && bankAccountIdOrUser) {
      const receipts = getLocal<InstallmentPaymentReceipt[]>('payment_receipts', INITIAL_PAYMENT_RECEIPTS);
      const rIndex = receipts.findIndex((r) => r.id === receiptId);
      if (rIndex !== -1) {
        receipts[rIndex].bank_account_id = bankAccountIdOrUser;
        setLocal('payment_receipts', receipts);
      }
    }
    return this.updateChequeStatus(receiptId, 'cleared', user);
  }
};
