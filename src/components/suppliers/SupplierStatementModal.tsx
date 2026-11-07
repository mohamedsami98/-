import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Building2, Calendar, FileSpreadsheet, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Supplier } from '../../types';
import { financialService } from '../../lib/financialService';
import * as XLSX from 'xlsx';

interface SupplierStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: Supplier;
}

export const SupplierStatementModal: React.FC<SupplierStatementModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState<any>(null);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (isOpen && supplier) {
      loadStatement();
    }
  }, [isOpen, supplier, fromDate, toDate]);

  const loadStatement = async () => {
    setLoading(true);
    try {
      const data = await financialService.getSupplierStatement(supplier.id, fromDate, toDate);
      setStatement(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    if (!statement) return;

    const wb = XLSX.utils.book_new();
    const rows = [
      [`كشف حساب المورد: ${supplier.name} (${supplier.code})`],
      [`النشاط: ${supplier.category_ar || supplier.category}`, `الهاتف: ${supplier.phone}`, `الرقم الضريبي: ${supplier.tax_number || 'غير مسجل'}`],
      [`تاريخ استخراج الكشف: ${new Date().toLocaleDateString('ar-EG')}`],
      [],
      ['التاريخ', 'نوع الحركة', 'المرجع / السند', 'المشروع', 'البيان المحاسبي', 'مدين (مسدد للمورد)', 'دائن (توريدات وفواتير)', 'الرصيد التراكمي المستحق'],
    ];

    statement.transactions.forEach((tx: any) => {
      rows.push([
        tx.date,
        tx.type_ar,
        tx.reference,
        tx.project_name || 'عام',
        tx.description,
        tx.debit,
        tx.credit,
        tx.balance,
      ]);
    });

    rows.push([]);
    rows.push(['الإجماليات', '', '', '', '', statement.total_debit, statement.total_credit, statement.final_balance]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 18 }, { wch: 24 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'كشف حساب مورد');
    XLSX.writeFile(wb, `كشف_حساب_${supplier.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 print:bg-white print:border-none print:shadow-none print:text-black">
        {/* Header - Hidden on print */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">كشف حساب مورد تفصيلي</h3>
              <p className="text-xs text-slate-400">
                {supplier.name} • كود: {supplier.code} • الرصيد المستحق: {supplier.current_balance.toLocaleString()} ج.م
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>إكسيل</span>
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة رسمية</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters - Hidden on print */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex flex-wrap items-center gap-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">من تاريخ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">إلى تاريخ:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white"
            />
          </div>
          {(fromDate || toDate) && (
            <button
              onClick={() => { setFromDate(''); setToDate(''); }}
              className="text-xs text-amber-400 hover:underline"
            >
              إلغاء الفلاتر
            </button>
          )}
        </div>

        {/* Statement Content */}
        <div className="p-6 overflow-y-auto max-h-[70vh] print:max-h-none print:p-8">
          {/* Official Letterhead for Print */}
          <div className="border-b-2 border-slate-700 pb-4 mb-6 print:border-black">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-white print:text-black">شركة النخبة للمقاولات والتطوير العقاري</h1>
                <p className="text-xs text-slate-400 print:text-slate-700">إدارة الحسابات العامة والمراجعة المالية</p>
                <p className="text-xs text-slate-400 print:text-slate-700">القاهرة الجديدة - التجمع الخامس</p>
              </div>
              <div className="text-left">
                <span className="inline-block px-3 py-1 rounded bg-blue-500/20 text-blue-400 font-bold text-sm border border-blue-500/30 print:border print:text-black">
                  كشف حساب مورد معتمد
                </span>
                <p className="text-xs text-slate-400 mt-1 print:text-black">
                  التاريخ: {new Date().toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>

            {/* Supplier Info Box */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-800 print:bg-slate-50 print:border-slate-300 print:text-black">
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">اسم المورد:</span>
                <span className="text-xs font-bold text-white print:text-black">{supplier.name}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">كود المورد:</span>
                <span className="text-xs font-bold text-white print:text-black">{supplier.code}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">الهاتف:</span>
                <span className="text-xs font-bold text-white print:text-black" dir="ltr">{supplier.phone}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">الرقم الضريبي:</span>
                <span className="text-xs font-bold text-white print:text-black">{supplier.tax_number || '—'}</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400">جاري إعداد كشف الحساب...</div>
          ) : !statement || statement.transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">لا توجد حركات مسجلة لهذا المورد في الفترة المحددة.</div>
          ) : (
            <>
              {/* Transactions Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-black">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 print:bg-slate-200 print:text-black font-bold">
                    <tr>
                      <th className="p-2.5">التاريخ</th>
                      <th className="p-2.5">نوع الحركة</th>
                      <th className="p-2.5">رقم السند/الفاتورة</th>
                      <th className="p-2.5">المشروع</th>
                      <th className="p-2.5">البيان</th>
                      <th className="p-2.5 text-center text-emerald-400 print:text-black">مدين (سداد)</th>
                      <th className="p-2.5 text-center text-amber-400 print:text-black">دائن (توريد)</th>
                      <th className="p-2.5 text-left">الرصيد المستحق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                    {statement.initial_balance !== 0 && (
                      <tr className="bg-slate-800/30 print:bg-slate-100 italic">
                        <td colSpan={5} className="p-2.5 text-slate-400 print:text-black font-semibold">
                          رصيد ما قبل الفترة
                        </td>
                        <td className="p-2.5 text-center">—</td>
                        <td className="p-2.5 text-center">—</td>
                        <td className="p-2.5 text-left font-bold text-white print:text-black">
                          {statement.initial_balance.toLocaleString()} ج.م
                        </td>
                      </tr>
                    )}
                    {statement.transactions.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 print:hover:bg-transparent">
                        <td className="p-2.5 text-slate-300 print:text-black whitespace-nowrap">{tx.date}</td>
                        <td className="p-2.5">
                          <span className={`inline-flex items-center gap-1 font-semibold ${
                            tx.type === 'payment' ? 'text-emerald-400 print:text-black' : 'text-amber-400 print:text-black'
                          }`}>
                            {tx.type === 'payment' ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                            {tx.type_ar}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-300 print:text-black font-semibold">{tx.reference}</td>
                        <td className="p-2.5 text-slate-300 print:text-black">{tx.project_name || '—'}</td>
                        <td className="p-2.5 text-slate-300 print:text-black max-w-xs truncate">{tx.description}</td>
                        <td className="p-2.5 text-center font-bold text-emerald-400 print:text-black">
                          {tx.debit > 0 ? `${tx.debit.toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-2.5 text-center font-bold text-amber-400 print:text-black">
                          {tx.credit > 0 ? `${tx.credit.toLocaleString()} ج.م` : '—'}
                        </td>
                        <td className="p-2.5 text-left font-bold text-white print:text-black whitespace-nowrap">
                          {tx.balance.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-950 print:bg-slate-100 font-bold border-t-2 border-slate-700 print:border-black">
                    <tr>
                      <td colSpan={5} className="p-3 text-white print:text-black">
                        إجمالي الحركات والرصيد الختامي المستحق:
                      </td>
                      <td className="p-3 text-center text-emerald-400 print:text-black">
                        {statement.total_debit.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-center text-amber-400 print:text-black">
                        {statement.total_credit.toLocaleString()} ج.م
                      </td>
                      <td className="p-3 text-left text-base text-rose-400 print:text-black">
                        {statement.final_balance.toLocaleString()} ج.م
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures for Print */}
              <div className="hidden print:grid grid-cols-3 gap-6 mt-12 text-center text-xs font-bold pt-8 border-t border-slate-400">
                <div>
                  <p className="mb-8">إعداد ومراجعة الحسابات</p>
                  <p>.......................................</p>
                </div>
                <div>
                  <p className="mb-8">المدير المالي للشركة</p>
                  <p>.......................................</p>
                </div>
                <div>
                  <p className="mb-8">اعتماد الإدارة العامة</p>
                  <p>.......................................</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
