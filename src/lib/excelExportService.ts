import * as XLSX from 'xlsx';
import { financialService } from './financialService';
import { dataService } from './supabase';
import { 
  Project, 
  Tower, 
  TowerUnit, 
  Expense, 
  MaterialItem, 
  InventoryTransaction, 
  ContractInstallment, 
  InstallmentPaymentReceipt, 
  BankAccount, 
  BankTransaction 
} from '../types';

export async function generateContractingExcelWorkbook(): Promise<void> {
  const wb = XLSX.utils.book_new();

  // Load all live system data
  const [
    projects,
    towers,
    units,
    expenses,
    materials,
    stockMovements,
    installments,
    receipts,
    bankAccounts,
    bankTransactions
  ]: [
    Project[],
    Tower[],
    TowerUnit[],
    Expense[],
    MaterialItem[],
    InventoryTransaction[],
    ContractInstallment[],
    InstallmentPaymentReceipt[],
    BankAccount[],
    BankTransaction[]
  ] = await Promise.all([
    dataService.getProjects(),
    dataService.getTowers(),
    financialService.getUnits(),
    financialService.getExpenses(),
    financialService.getMaterialItems(),
    financialService.getInventoryTransactions(),
    financialService.getContractInstallments(),
    financialService.getPaymentReceipts(),
    financialService.getBankAccounts(),
    financialService.getBankTransactions()
  ]);

  // ==========================================
  // Sheet 1: لوحة المؤشرات الإجمالية (Dashboard)
  // ==========================================
  const totalExpenses = expenses.reduce((s: number, e: Expense) => s + Number(e.amount || 0), 0);
  const totalInstallments = installments.reduce((s: number, i: ContractInstallment) => s + Number(i.amount || 0), 0);
  const totalCollected = receipts.reduce((s: number, r: InstallmentPaymentReceipt) => s + Number(r.amount_paid || r.amount || 0), 0);
  const totalBankLiquidity = bankAccounts.reduce((s: number, b: BankAccount) => s + Number(b.balance || 0), 0);
  const totalInventoryVal = materials.reduce(
    (s: number, m: MaterialItem) => s + (Number(m.current_quantity || 0) * Number(m.avg_unit_cost || 0)), 
    0
  );

  const dashboardData = [
    ['نظام إدارة شركات المقاولات والتطوير العقاري - تقرير النموذج المالي الشامل (Excel Workbook)'],
    ['تاريخ الإصدار:', new Date().toLocaleDateString('ar-EG'), 'المستخدم المسؤول:', 'مدير الحسابات والعمليات'],
    [],
    ['مؤشر الأداء والسيولة', 'القيمة التراكمية (ج.م)', 'ملاحظات المحاسبة والتشغيل'],
    ['إجمالي المشروعات الفعالة', projects.length, 'مشروعات سكنية وتجارية وإدارية'],
    ['إجمالي الأبراج الإنشائية', towers.length, 'أبراج تحت التنفيذ والتشطيب والتسليم'],
    ['إجمالي الوحدات العقارية', units.length, 'وحدات سكنية وتجارية محصورة بالمتر المربع'],
    ['إجمالي تكاليف ومصروفات الأبراج المنفذة', totalExpenses, 'مصروفات خرسانات، حديد، تشطيبات، مقاولو باطن'],
    ['إجمالي قيمة عقود الأقساط', totalInstallments, 'إجمالي مستحقات مبيعات الوحدات'],
    ['إجمالي المبالغ المحصلة فعلياً', totalCollected, 'تحصيلات نقدية وحوالات وشيكات مفرغة'],
    ['المتبقي من الأقساط قيد التحصيل', totalInstallments - totalCollected, 'معادلة: (إجمالي الأقساط - المحصل)'],
    ['إجمالي السيولة في البنوك والخزائن', totalBankLiquidity, 'أرصدة فعلية مجمعة في الخزينة والحسابات البنكية'],
    ['إجمالي القيمة التقديرية لمخزون الخامات', totalInventoryVal, 'معادلة: (الكمية المتوفرة × متوسط سعر التكلفة)'],
  ];

  const wsDashboard = XLSX.utils.aoa_to_sheet(dashboardData);
  wsDashboard['!cols'] = [{ wch: 38 }, { wch: 24 }, { wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsDashboard, 'لوحة المؤشرات');

  // ==========================================
  // Sheet 2: الأبراج والوحدات (Towers & Units)
  // ==========================================
  const towersUnitsData: (string | number)[][] = [
    [
      'كود الوحدة',
      'البرج التابع له',
      'المشروع',
      'نوع الوحدة',
      'الدور',
      'رقم الوحدة',
      'المساحة (م²)',
      'سعر البيع الإجمالي (ج.م)',
      'نصيب الوحدة من التكلفة الموزعة (ج.م)',
      'تكلفة المتر المنفذ (ج.م/م²)',
      'حالة الوحدة',
      'اسم العميل المشترى'
    ]
  ];

  units.forEach((u: TowerUnit) => {
    towersUnitsData.push([
      u.id,
      u.tower_name || '-',
      u.project_name || '-',
      u.unit_type === 'apartment' ? 'شقة سكنية' : u.unit_type === 'commercial_shop' ? 'محل تجاري' : u.unit_type === 'administrative_office' ? 'مكتب إداري' : 'أخرى',
      u.floor_number,
      u.unit_number,
      u.area_sqm,
      u.selling_price || 0,
      u.allocated_cost || 0,
      u.cost_per_sqm || 0,
      u.status === 'sold' ? 'مباعة' : u.status === 'reserved' ? 'محجوزة' : 'متاحة للبيع',
      u.client_name || '-'
    ]);
  });

  const wsUnits = XLSX.utils.aoa_to_sheet(towersUnitsData);
  wsUnits['!cols'] = [
    { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 10 },
    { wch: 12 }, { wch: 14 }, { wch: 22 }, { wch: 25 }, { wch: 22 },
    { wch: 15 }, { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsUnits, 'الأبراج والوحدات');

  // ==========================================
  // Sheet 3: التكاليف والمصروفات (Expenses)
  // ==========================================
  const expensesData: (string | number)[][] = [
    [
      'رقم إذن القيد',
      'التاريخ',
      'المشروع',
      'البرج المستفيد',
      'بند التكلفة / التصنيف',
      'المستفيد / المورد / المقاول',
      'المبلغ المصروف (ج.م)',
      'طريقة الدفع',
      'الحساب المسحوب منه',
      'رقم الفاتورة / المرجع',
      'البيان والشرح'
    ]
  ];

  expenses.forEach((e: Expense) => {
    expensesData.push([
      e.id,
      e.expense_date,
      e.project_name || '-',
      e.tower_name || '-',
      e.category_ar || e.category,
      e.supplier_beneficiary || 'عام',
      e.amount,
      e.payment_method === 'cash' ? 'نقدي' : e.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك',
      e.bank_account_name || 'الخزينة الرئيسية',
      e.invoice_number || '-',
      e.description
    ]);
  });

  const wsExpenses = XLSX.utils.aoa_to_sheet(expensesData);
  wsExpenses['!cols'] = [
    { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 22 },
    { wch: 22 }, { wch: 18 }, { wch: 14 }, { wch: 25 }, { wch: 18 }, { wch: 35 }
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'التكاليف والمصروفات');

  // ==========================================
  // Sheet 4: المخازن والمواد الخام (Inventory)
  // ==========================================
  const inventoryData: (string | number)[][] = [
    [
      'كود الصنف',
      'اسم المادة الخام',
      'المستودع',
      'وحدة القياس',
      'الرصيد المتاح بالمخزن',
      'متوسط تكلفة الوحدة (ج.م)',
      'إجمالي قيمة المخزون (ج.م)',
      'الحد الأدنى للطلب',
      'حالة الرصيد والتنبيه'
    ]
  ];

  materials.forEach((m: MaterialItem) => {
    const totalVal = Number(m.current_quantity || 0) * Number(m.avg_unit_cost || 0);
    const isLow = Number(m.current_quantity) <= Number(m.min_stock_level);
    inventoryData.push([
      m.code || m.id,
      m.name,
      m.warehouse_name || '-',
      m.unit,
      m.current_quantity,
      m.avg_unit_cost,
      totalVal,
      m.min_stock_level,
      isLow ? 'تحذير: أوشك على النفاذ' : 'رصيد آمن'
    ]);
  });

  const wsInventory = XLSX.utils.aoa_to_sheet(inventoryData);
  wsInventory['!cols'] = [
    { wch: 14 }, { wch: 22 }, { wch: 20 }, { wch: 12 }, { wch: 20 },
    { wch: 22 }, { wch: 22 }, { wch: 18 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsInventory, 'المخازن والخامات');

  // ==========================================
  // Sheet 5: أذون حركة المخزن (Stock Movements)
  // ==========================================
  const stockMovementsData: (string | number)[][] = [
    [
      'رقم الإذن',
      'التاريخ',
      'نوع الحركة',
      'المادة الخام',
      'الكمية',
      'سعر الوحدة (ج.م)',
      'إجمالي القيمة (ج.م)',
      'البرج المنصرف له / المورد',
      'رقم المستند',
      'البيان والملاحظات'
    ]
  ];

  stockMovements.forEach((sm: InventoryTransaction) => {
    stockMovementsData.push([
      sm.id,
      sm.transaction_date,
      sm.transaction_type === 'inward' ? 'إذن إضافة وتوريد (+)' : 'إذن صرف على برج (-)',
      sm.item_name,
      sm.quantity,
      sm.unit_price,
      sm.total_cost,
      sm.transaction_type === 'inward' ? (sm.supplier_name || 'مورد') : (sm.tower_name || 'موقع البرج'),
      sm.document_number || '-',
      sm.notes || '-'
    ]);
  });

  const wsStockMovements = XLSX.utils.aoa_to_sheet(stockMovementsData);
  wsStockMovements['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 12 },
    { wch: 16 }, { wch: 18 }, { wch: 25 }, { wch: 18 }, { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsStockMovements, 'أذون التوريد والصرف');

  // ==========================================
  // Sheet 6: الأقساط ومستحقات العملاء (Installments)
  // ==========================================
  const installmentsData: (string | number)[][] = [
    [
      'كود القسط',
      'رقم العقد',
      'اسم العميل',
      'المشروع',
      'البرج',
      'الوحدة',
      'عنوان القسط',
      'تاريخ الاستحقاق',
      'قيمة القسط (ج.م)',
      'حالة القسط',
      'تاريخ السداد الفعلي',
      'طريقة السداد'
    ]
  ];

  installments.forEach((inst: ContractInstallment) => {
    installmentsData.push([
      inst.id,
      inst.contract_number,
      inst.client_name,
      inst.project_name,
      inst.tower_name,
      inst.unit_number,
      inst.installment_title,
      inst.due_date,
      inst.amount,
      inst.status === 'paid' ? 'مسدد بالكامل' : inst.status === 'overdue' ? 'متأخر ومستحق' : 'قيد الانتظار',
      inst.payment_date || '-',
      inst.payment_method === 'cash' ? 'نقدي' : inst.payment_method === 'bank_transfer' ? 'تحويل بنكي' : inst.payment_method === 'cheque' ? 'شيك بنكي' : '-'
    ]);
  });

  const wsInstallments = XLSX.utils.aoa_to_sheet(installmentsData);
  wsInstallments['!cols'] = [
    { wch: 14 }, { wch: 15 }, { wch: 22 }, { wch: 20 }, { wch: 18 },
    { wch: 12 }, { wch: 20 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 15 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsInstallments, 'سجل الأقساط');

  // ==========================================
  // Sheet 7: سندات القبض المعتمدة (Payment Receipts)
  // ==========================================
  const receiptsData: (string | number)[][] = [
    [
      'رقم سند القبض',
      'تاريخ السند',
      'اسم العميل',
      'رقم العقد',
      'البرج والوحدة',
      'المبلغ المحصل (ج.م)',
      'طريقة التحصيل',
      'الحساب المودع به',
      'بيانات الشيك / الحوالة',
      'حالة الشيك',
      'المحصل المعتمد'
    ]
  ];

  receipts.forEach((r: InstallmentPaymentReceipt) => {
    receiptsData.push([
      r.receipt_number,
      r.payment_date,
      r.client_name,
      r.contract_number,
      `${r.tower_name || ''} - ${r.unit_number || ''}`,
      r.amount_paid || r.amount,
      r.payment_method === 'cash' ? 'نقدي' : r.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك',
      r.bank_account_name || 'الخزينة',
      r.payment_method === 'cheque' ? `شيك رقم ${r.cheque_number} - بنك ${r.cheque_bank_name}` : (r.transfer_reference || r.transfer_reference_number || '-'),
      r.cheque_status === 'cleared' ? 'تم تحصيله وإيداعه' : r.cheque_status === 'under_collection' ? 'شيك تحت التحصيل' : '-',
      r.created_by_name || 'مسؤول الخزينة'
    ]);
  });

  const wsReceipts = XLSX.utils.aoa_to_sheet(receiptsData);
  wsReceipts['!cols'] = [
    { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 15 }, { wch: 20 },
    { wch: 18 }, { wch: 14 }, { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 20 }
  ];
  XLSX.utils.book_append_sheet(wb, wsReceipts, 'سندات القبض');

  // ==========================================
  // Sheet 8: الحسابات البنكية والسيولة (Banking & Ledger)
  // ==========================================
  const bankAccountsData: (string | number)[][] = [
    [
      'كود الحساب',
      'اسم البنك / جهة الخزينة',
      'اسم الحساب الرسمي',
      'رقم الحساب / IBAN',
      'نوع الحساب',
      'الفرع',
      'الرصيد الفعلي الحالي (ج.م)'
    ]
  ];

  bankAccounts.forEach((ba: BankAccount) => {
    bankAccountsData.push([
      ba.id,
      ba.bank_name,
      ba.account_name,
      ba.account_number,
      ba.account_type === 'cashbox' ? 'خزينة نقدية' : 'حساب بنكي جاري',
      ba.branch || 'الرئيسي',
      ba.balance
    ]);
  });

  const wsBankAccs = XLSX.utils.aoa_to_sheet(bankAccountsData);
  wsBankAccs['!cols'] = [
    { wch: 14 }, { wch: 22 }, { wch: 25 }, { wch: 20 }, { wch: 18 },
    { wch: 15 }, { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsBankAccs, 'أرصدة البنوك والخزائن');

  // ==========================================
  // Sheet 9: دفتر الأستاذ لحركات البنوك (Bank Transactions)
  // ==========================================
  const bankLedgerData: (string | number)[][] = [
    [
      'رقم الحركة',
      'التاريخ',
      'الحساب / الخزينة',
      'نوع الحركة',
      'قيمة الحركة (ج.م)',
      'الرصيد بعد الحركة (ج.م)',
      'التصنيف',
      'البيان المحاسبي'
    ]
  ];

  bankTransactions.forEach((tx: BankTransaction) => {
    bankLedgerData.push([
      tx.id,
      tx.transaction_date,
      tx.bank_account_name || tx.account_name,
      tx.transaction_type === 'deposit' ? 'إيداع وتحصيل (+)' : 'صرف ونفقة (-)',
      tx.amount,
      tx.balance_after,
      tx.category === 'installment_payment' ? 'تحصيل قسط عميل' : tx.category === 'expense_payout' ? 'صرف نفقة برج' : 'تسوية بنكية',
      tx.description
    ]);
  });

  const wsBankLedger = XLSX.utils.aoa_to_sheet(bankLedgerData);
  wsBankLedger['!cols'] = [
    { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 18 }, { wch: 18 },
    { wch: 22 }, { wch: 20 }, { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, wsBankLedger, 'دفتر حركات البنوك');

  // Trigger browser download
  const dateStr = new Date().toISOString().split('T')[0];
  const fileName = `منظومة_المقاولات_والتطوير_العقاري_الشاملة_${dateStr}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
