import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Filter, 
  Receipt, 
  CreditCard, 
  FileText, 
  Phone, 
  Mail, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  FileSpreadsheet, 
  Printer, 
  Trash2, 
  Edit3, 
  ChevronRight,
  Landmark
} from 'lucide-react';
import { Supplier, SupplierInvoice, SupplierPayment, SupplierCategory } from '../../types';
import { financialService } from '../../lib/financialService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { SupplierFormModal } from './SupplierFormModal';
import { SupplierInvoiceModal } from './SupplierInvoiceModal';
import { SupplierPaymentModal } from './SupplierPaymentModal';
import { SupplierStatementModal } from './SupplierStatementModal';
import { LoadingSpinner } from '../common/LoadingSpinner';
import * as XLSX from 'xlsx';

export const SuppliersView: React.FC = () => {
  const { user, hasPermission } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'suppliers' | 'invoices' | 'payments'>('suppliers');
  
  // Data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<string>('all');

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [defaultInvoiceSupplierId, setDefaultInvoiceSupplierId] = useState<string | undefined>(undefined);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [defaultPaymentSupplierId, setDefaultPaymentSupplierId] = useState<string | undefined>(undefined);
  const [defaultPaymentInvoiceId, setDefaultPaymentInvoiceId] = useState<string | undefined>(undefined);

  const [selectedStatementSupplier, setSelectedStatementSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sups, invs, pays] = await Promise.all([
        financialService.getSuppliers(),
        financialService.getSupplierInvoices(),
        financialService.getSupplierPayments(),
      ]);
      setSuppliers(sups);
      setInvoices(invs);
      setPayments(pays);
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تحميل بيانات الموردين');
    } finally {
      setLoading(false);
    }
  };

  // Supplier CRUD
  const handleOpenAddSupplier = () => {
    setSupplierToEdit(null);
    setIsSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setSupplierToEdit(sup);
    setIsSupplierModalOpen(true);
  };

  const handleSupplierSubmit = async (data: any) => {
    try {
      if (supplierToEdit) {
        await financialService.updateSupplier(supplierToEdit.id, data, user);
        success(`تم تحديث بيانات المورد "${data.name}" بنجاح`);
      } else {
        await financialService.createSupplier(data, user);
        success(`تمت إضافة المورد "${data.name}" بنجاح`);
      }
      loadData();
    } catch (err: any) {
      error(err.message || 'فشلت عملية حفظ المورد');
      throw err;
    }
  };

  const handleDeleteSupplier = async (sup: Supplier) => {
    const confirmDelete = window.confirm(`هل أنت متأكد من حذف المورد "${sup.name}"؟`);
    if (!confirmDelete) return;

    try {
      await financialService.deleteSupplier(sup.id, user);
      success(`تم حذف المورد "${sup.name}" بنجاح`);
      loadData();
    } catch (err: any) {
      error(err.message || 'تعذر حذف المورد');
    }
  };

  // Invoice Submit
  const handleInvoiceSubmit = async (data: any) => {
    try {
      await financialService.createSupplierInvoice(data, user);
      success(`تم تسجيل فاتورة رقم ${data.invoice_number} بنجاح`);
      loadData();
    } catch (err: any) {
      error(err.message || 'فشل تسجيل الفاتورة');
      throw err;
    }
  };

  // Payment Submit
  const handlePaymentSubmit = async (data: any) => {
    try {
      await financialService.createSupplierPayment(data, user);
      success(`تم صرف دفعة بمبلغ ${Number(data.amount).toLocaleString()} ج.م للمورد بنجاح`);
      loadData();
    } catch (err: any) {
      error(err.message || 'فشل تسجيل سند الصرف');
      throw err;
    }
  };

  // Excel Export
  const handleExportSuppliersExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      ['سجل الموردين ومقاولي الباطن - شركة النخبة للمقاولات'],
      [`تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG')}`],
      [],
      ['كود المورد', 'اسم المورد', 'التصنيف / النشاط', 'المسؤول', 'الهاتف', 'الرقم الضريبي', 'إجمالي الفواتير (ج.م)', 'إجمالي المسدد (ج.م)', 'الرصيد المستحق الحالي (ج.م)', 'الحالة'],
    ];

    suppliers.forEach((s) => {
      rows.push([
        s.code,
        s.name,
        s.category_ar || s.category,
        s.contact_person,
        s.phone,
        s.tax_number || '—',
        s.total_invoiced,
        s.total_paid,
        s.current_balance,
        s.is_active ? 'نشط' : 'موقوف',
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 24 }, { wch: 20 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 12 }];
    XLSX.utils.book_append_sheet(wb, ws, 'الموردين ومقاولو الباطن');
    XLSX.writeFile(wb, `سجل_الموردين_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Aggregated KPIs
  const totalSuppliersCount = suppliers.length;
  const totalInvoicedSum = suppliers.reduce((s, curr) => s + curr.total_invoiced, 0);
  const totalPaidSum = suppliers.reduce((s, curr) => s + curr.total_paid, 0);
  const totalOutstandingBalance = suppliers.reduce((s, curr) => s + curr.current_balance, 0);

  // Filtering suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contact_person.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery);

    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Filtering invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.project_name && inv.project_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      inv.items_summary.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = invoiceStatusFilter === 'all' || inv.status === invoiceStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Filtering payments
  const filteredPayments = payments.filter((pay) => {
    return (
      pay.payment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.supplier_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pay.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (pay.transfer_reference && pay.transfer_reference.includes(searchQuery)) ||
      (pay.cheque_number && pay.cheque_number.includes(searchQuery))
    );
  });

  if (loading) {
    return (
      <div className="py-20 flex justify-center">
        <LoadingSpinner message="جاري تحميل سجلات الموردين وفواتير التوريد..." />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">إدارة الموردين ومقاولي الباطن</h2>
            <p className="text-xs text-slate-400 mt-1">
              متابعة حسابات الموردين، أوامر وفواتير التوريد، وسندات الصرف، وكشوفات الحسابات المعتمدة
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportSuppliersExcel}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-emerald-400 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير إكسيل</span>
          </button>
          <button
            onClick={() => {
              setDefaultInvoiceSupplierId(undefined);
              setIsInvoiceModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-400 transition-colors"
          >
            <Receipt className="w-4 h-4" />
            <span>تسجيل فاتورة توريد</span>
          </button>
          <button
            onClick={() => {
              setDefaultPaymentSupplierId(undefined);
              setDefaultPaymentInvoiceId(undefined);
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-400 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            <span>سند صرف لمورد</span>
          </button>
          <button
            onClick={handleOpenAddSupplier}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مورد جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Suppliers */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">إجمالي الموردين والشركات</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{totalSuppliersCount}</span>
            <span className="text-xs text-slate-400 mr-2">مورد ومقاول باطن</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">تشمل موردي الحديد، الخرسانة، ومقاولي التشطيبات</p>
        </div>

        {/* Total Invoiced */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">إجمالي الفواتير والمستخلصات</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-amber-400">
              {totalInvoicedSum.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">إجمالي المطالبات وتوريدات الخامات المنفذة</p>
        </div>

        {/* Total Paid */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">إجمالي المبالغ المسددة فعلياً</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-400">
              {totalPaidSum.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 mr-1.5">ج.م</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">مسددة عبر البنوك والخزائن بشيكات وحوالات</p>
        </div>

        {/* Outstanding Balance */}
        <div className="bg-slate-900 border border-rose-900/30 p-5 rounded-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 to-rose-950/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">أرصدة الموردين المستحقة (المتبقي)</span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-rose-400">
              {totalOutstandingBalance.toLocaleString()}
            </span>
            <span className="text-xs text-rose-300/80 mr-1.5">ج.م</span>
          </div>
          <p className="text-[11px] text-rose-400/70 mt-2">إجمالي المديونية الآجلة الواجبة السداد للموردين</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'suppliers'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>سجل الموردين ومقاولي الباطن ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invoices')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'invoices'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>فواتير ومستخلصات التوريد ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'payments'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>سندات الصرف والمدفوعات ({payments.length})</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'suppliers'
                ? 'ابحث باسم المورد، الكود، أو رقم الهاتف...'
                : activeTab === 'invoices'
                ? 'ابحث برقم الفاتورة، اسم المورد، أو المشروع...'
                : 'ابحث برقم السند، المورد، أو رقم الشيك/التحويل...'
            }
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pr-10 pl-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
        </div>

        {activeTab === 'suppliers' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">التصنيف:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">كافة التخصصات والأنشطة</option>
              <option value="steel">حديد تسليح ومعدن</option>
              <option value="building_materials">مواد بناء وخرسانة وأسمنت</option>
              <option value="subcontractor">مقاول باطن</option>
              <option value="electrical_plumbing">كهرباء وصحي</option>
              <option value="machinery_rental">معدات وأوناش</option>
              <option value="finishes">تشطيبات</option>
            </select>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">حالة السداد:</span>
            <select
              value={invoiceStatusFilter}
              onChange={(e) => setInvoiceStatusFilter(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">الكل</option>
              <option value="unpaid">غير مسددة (آجلة بالكامل)</option>
              <option value="partially_paid">مسددة جزئياً</option>
              <option value="paid">مسددة بالكامل</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSuppliers.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
              لم يتم العثور على أي موردين يطابقون خيارات البحث.
            </div>
          ) : (
            filteredSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono text-[11px] font-bold border border-blue-500/20 mb-1">
                        {sup.code}
                      </span>
                      <h3 className="text-base font-bold text-white hover:text-blue-400 transition-colors">
                        {sup.name}
                      </h3>
                      {sup.company_name && (
                        <p className="text-xs text-slate-400 truncate mt-0.5">{sup.company_name}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {sup.category_ar || sup.category}
                    </span>
                  </div>

                  {/* Contact info */}
                  <div className="space-y-1.5 py-3 border-y border-slate-800/80 text-xs text-slate-400">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        المسؤول: {sup.contact_person}
                      </span>
                      <a href={`tel:${sup.phone}`} className="text-blue-400 font-mono hover:underline" dir="ltr">
                        {sup.phone}
                      </a>
                    </div>
                    {sup.tax_number && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">الرقم الضريبي:</span>
                        <span className="font-mono text-slate-300">{sup.tax_number}</span>
                      </div>
                    )}
                    {sup.bank_name && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">البنك المعتمد:</span>
                        <span className="text-slate-300 truncate max-w-[180px]">{sup.bank_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Financial Stats */}
                  <div className="grid grid-cols-3 gap-2 my-4 text-center">
                    <div className="p-2 rounded-xl bg-slate-800/50">
                      <span className="text-[10px] text-slate-400 block mb-0.5">التوريدات</span>
                      <span className="text-xs font-bold text-amber-400">
                        {sup.total_invoiced.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-800/50">
                      <span className="text-[10px] text-slate-400 block mb-0.5">المسدد</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {sup.total_paid.toLocaleString()}
                      </span>
                    </div>
                    <div className="p-2 rounded-xl bg-rose-950/20 border border-rose-900/30">
                      <span className="text-[10px] text-rose-400 block mb-0.5">المستحق</span>
                      <span className="text-xs font-bold text-rose-400">
                        {sup.current_balance.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setSelectedStatementSupplier(sup)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-blue-400 transition-colors flex items-center gap-1"
                      title="كشف حساب تفصيلي"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>كشف حساب</span>
                    </button>
                    <button
                      onClick={() => {
                        setDefaultPaymentSupplierId(sup.id);
                        setDefaultPaymentInvoiceId(undefined);
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-400 border border-emerald-500/30 transition-colors flex items-center gap-1"
                      title="صرف دفعة للمورد"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>سداد</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditSupplier(sup)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="تعديل"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(sup)}
                      className="p-1.5 rounded-lg hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Invoices and Bills */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">رقم الفاتورة</th>
                  <th className="p-3.5">المورد</th>
                  <th className="p-3.5">المشروع / البرج</th>
                  <th className="p-3.5">تاريخ التوريد</th>
                  <th className="p-3.5">بيان التوريد / الأعمال</th>
                  <th className="p-3.5 text-center">إجمالي الفاتورة</th>
                  <th className="p-3.5 text-center">المسدد</th>
                  <th className="p-3.5 text-center">المتبقي</th>
                  <th className="p-3.5 text-center">الحالة</th>
                  <th className="p-3.5 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-slate-400">
                      لم يتم العثور على أي فواتير مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {inv.invoice_number}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">{inv.supplier_name}</td>
                      <td className="p-3.5 text-slate-300">
                        {inv.project_name ? (
                          <div>
                            <span className="font-semibold block">{inv.project_name}</span>
                            {inv.tower_name && (
                              <span className="text-[11px] text-slate-400">{inv.tower_name}</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-500">عام</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">{inv.invoice_date}</td>
                      <td className="p-3.5 text-slate-300 max-w-xs truncate" title={inv.items_summary}>
                        {inv.items_summary}
                      </td>
                      <td className="p-3.5 text-center font-bold text-amber-400 whitespace-nowrap">
                        {inv.total_amount.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 text-center font-bold text-emerald-400 whitespace-nowrap">
                        {inv.paid_amount.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 text-center font-bold text-rose-400 whitespace-nowrap">
                        {inv.remaining_amount.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            inv.status === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : inv.status === 'partially_paid'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {inv.status === 'paid'
                            ? 'مسددة بالكامل'
                            : inv.status === 'partially_paid'
                            ? 'مسددة جزئياً'
                            : 'غير مسددة (آجلة)'}
                        </span>
                      </td>
                      <td className="p-3.5 text-center whitespace-nowrap">
                        {inv.status !== 'paid' && (
                          <button
                            onClick={() => {
                              setDefaultPaymentSupplierId(inv.supplier_id);
                              setDefaultPaymentInvoiceId(inv.id);
                              setIsPaymentModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-colors"
                          >
                            سداد الآن
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Payment Vouchers */}
      {activeTab === 'payments' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-800/80 text-slate-300 font-bold border-b border-slate-700">
                <tr>
                  <th className="p-3.5">رقم سند الصرف</th>
                  <th className="p-3.5">المورد المستفيد</th>
                  <th className="p-3.5">تاريخ الصرف</th>
                  <th className="p-3.5">المبلغ المسدد</th>
                  <th className="p-3.5">طريقة الدفع</th>
                  <th className="p-3.5">الحساب / الخزينة</th>
                  <th className="p-3.5">المرجع / الشيك</th>
                  <th className="p-3.5">البيان المحاسبي</th>
                  <th className="p-3.5">المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      لم يتم العثور على أي سندات صرف مسجلة.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-white whitespace-nowrap">
                        {pay.payment_number}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-200">{pay.supplier_name}</td>
                      <td className="p-3.5 text-slate-300 whitespace-nowrap">{pay.payment_date}</td>
                      <td className="p-3.5 font-bold text-emerald-400 whitespace-nowrap">
                        {pay.amount.toLocaleString()} ج.م
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold">
                          {pay.payment_method === 'cash'
                            ? 'نقداً من الخزينة'
                            : pay.payment_method === 'bank_transfer'
                            ? 'تحويل بنكي'
                            : 'شيك بنكي'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-[180px] truncate">{pay.bank_account_name}</td>
                      <td className="p-3.5 font-mono text-slate-300">
                        {pay.cheque_number ? `شيك ${pay.cheque_number}` : pay.transfer_reference || '—'}
                      </td>
                      <td className="p-3.5 text-slate-300 max-w-xs truncate">{pay.description}</td>
                      <td className="p-3.5 text-slate-400 whitespace-nowrap">{pay.created_by_name}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSubmit={handleSupplierSubmit}
        supplierToEdit={supplierToEdit}
      />

      <SupplierInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onSubmit={handleInvoiceSubmit}
        suppliers={suppliers}
        defaultSupplierId={defaultInvoiceSupplierId}
      />

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSubmit={handlePaymentSubmit}
        suppliers={suppliers}
        defaultSupplierId={defaultPaymentSupplierId}
        defaultInvoiceId={defaultPaymentInvoiceId}
      />

      {selectedStatementSupplier && (
        <SupplierStatementModal
          isOpen={Boolean(selectedStatementSupplier)}
          onClose={() => setSelectedStatementSupplier(null)}
          supplier={selectedStatementSupplier}
        />
      )}
    </div>
  );
};
