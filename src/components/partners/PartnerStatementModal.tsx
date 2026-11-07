import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Users, FileSpreadsheet, Percent, DollarSign, ArrowUpRight, TrendingUp, ShieldCheck } from 'lucide-react';
import { Partner, PartnerFinancialCalculation, PartnerDistribution } from '../../types';
import { financialService } from '../../lib/financialService';
import * as XLSX from 'xlsx';

interface PartnerStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner;
}

export const PartnerStatementModal: React.FC<PartnerStatementModalProps> = ({
  isOpen,
  onClose,
  partner,
}) => {
  const [loading, setLoading] = useState(true);
  const [calculations, setCalculations] = useState<PartnerFinancialCalculation[]>([]);
  const [distributions, setDistributions] = useState<PartnerDistribution[]>([]);

  useEffect(() => {
    if (isOpen && partner) {
      loadData();
    }
  }, [isOpen, partner]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allCalcs, allDists] = await Promise.all([
        financialService.getAllPartnersFinancialCalculations(),
        financialService.getPartnerDistributions(partner.id),
      ]);
      setCalculations(allCalcs.filter((c) => c.partner_id === partner.id));
      setDistributions(allDists);
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
    const wb = XLSX.utils.book_new();
    const rows: (string | number)[][] = [
      [`تقرير حسابات الشريك وتوزيع الأرباح والتكاليف: ${partner.name} (${partner.code})`],
      [`الصفة: ${partner.partner_type_ar || partner.partner_type}`, `الهاتف: ${partner.phone}`, `الرقم القومي: ${partner.national_id || '—'}`],
      [`تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}`],
      [],
      ['المشروع', 'المبلغ المدخل من الشريك', 'المبلغ الإجمالي للمشروع', 'نسبة الشريك %', 'تكلفة المشروع الفعلية', 'نصيب الشريك من التكلفة', 'إيرادات المشروع', 'نصيب الشريك من الأرباح', 'العائد ROI%', 'التوزيعات والمسحوبات', 'صافي المستحق حالياً'],
    ];

    calculations.forEach((c) => {
      rows.push([
        c.project_name,
        c.investment_amount,
        c.project_total_budget,
        `${c.share_percentage}%`,
        c.actual_project_cost,
        c.partner_cost_share,
        c.project_total_revenue,
        c.partner_profit_share,
        `${c.roi_percentage}%`,
        c.total_distributed,
        c.net_balance_due,
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 20 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws, 'كشف حساب الشريك');
    XLSX.writeFile(wb, `كشف_شريك_${partner.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!isOpen) return null;

  const totalInvested = calculations.reduce((acc, c) => acc + c.investment_amount, 0);
  const totalCostShare = calculations.reduce((acc, c) => acc + c.partner_cost_share, 0);
  const totalProfitShare = calculations.reduce((acc, c) => acc + c.partner_profit_share, 0);
  const totalWithdrawn = calculations.reduce((acc, c) => acc + c.total_distributed, 0);
  const netDue = calculations.reduce((acc, c) => acc + c.net_balance_due, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 print:bg-white print:border-none print:shadow-none print:text-black">
        {/* Top Header - Hidden on Print */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">التقرير المالي وكشف حساب الشريك</h3>
              <p className="text-xs text-slate-400">
                {partner.name} • {partner.partner_type_ar || 'شريك'} • صافي المستحق: {netDue.toLocaleString()} ج.م
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة تقرير الشراكة</span>
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh] print:max-h-none print:p-8 space-y-6">
          {/* Official Letterhead */}
          <div className="border-b-2 border-slate-700 pb-4 print:border-black">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-bold text-white print:text-black">شركة النخبة للمقاولات والتطوير العقاري</h1>
                <p className="text-xs text-slate-400 print:text-slate-700">إدارة علاقات الشركاء والاستثمار العقاري</p>
                <p className="text-xs text-slate-400 print:text-slate-700">القاهرة الجديدة - التجمع الخامس</p>
              </div>
              <div className="text-left">
                <span className="inline-block px-3 py-1 rounded bg-purple-500/20 text-purple-400 font-bold text-sm border border-purple-500/30 print:border print:text-black">
                  تقرير شراكة وحسابات الأرباح
                </span>
                <p className="text-xs text-slate-400 mt-1 print:text-black">
                  تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}
                </p>
              </div>
            </div>

            {/* Partner Info Summary Card */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 p-3.5 bg-slate-800/40 rounded-xl border border-slate-800 print:bg-slate-50 print:border-slate-300 print:text-black">
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">اسم الشريك:</span>
                <span className="text-xs font-bold text-white print:text-black">{partner.name}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">صفة الشريك:</span>
                <span className="text-xs font-bold text-purple-400 print:text-black">{partner.partner_type_ar || 'شريك استثماري'}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">الهاتف:</span>
                <span className="text-xs font-bold text-white print:text-black" dir="ltr">{partner.phone}</span>
              </div>
              <div>
                <span className="text-[11px] text-slate-400 block print:text-slate-600">الرقم القومي:</span>
                <span className="text-xs font-bold text-white print:text-black">{partner.national_id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Aggregate KPI Summary for Partner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 print:border print:border-black">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي رأس المال المدخل</span>
              <span className="text-base font-bold text-purple-400 print:text-black">
                {totalInvested.toLocaleString()} ج.م
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 print:border print:border-black">
              <span className="text-[11px] text-slate-400 block mb-1">نصيب الشريك من التكاليف</span>
              <span className="text-base font-bold text-amber-400 print:text-black">
                {totalCostShare.toLocaleString()} ج.م
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 print:border print:border-black">
              <span className="text-[11px] text-slate-400 block mb-1">إجمالي نصيب الأرباح المحققة</span>
              <span className="text-base font-bold text-emerald-400 print:text-black">
                {totalProfitShare.toLocaleString()} ج.م
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40 print:border print:border-black">
              <span className="text-[11px] text-emerald-300 block mb-1">صافي الرصيد المستحق للشريك</span>
              <span className="text-lg font-extrabold text-emerald-400 print:text-black">
                {netDue.toLocaleString()} ج.م
              </span>
            </div>
          </div>

          {/* Section 1: Detailed Project Shares and Calculations Matrix */}
          <div>
            <h4 className="text-sm font-bold text-white print:text-black mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400 print:text-black" />
              <span>مساهمات المشروعات واحتساب الحصص والتكاليف والأرباح</span>
            </h4>

            {calculations.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">لا توجد مساهمات مسجلة لهذا الشريك في أي مشروع حالياً.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-black">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 print:bg-slate-200 print:text-black font-bold">
                    <tr>
                      <th className="p-3">المشروع</th>
                      <th className="p-3 text-center">مبلغ الشريك</th>
                      <th className="p-3 text-center">إجمالي المشروع</th>
                      <th className="p-3 text-center">النسبة %</th>
                      <th className="p-3 text-center">تكلفة المشروع</th>
                      <th className="p-3 text-center">نصيب التكلفة</th>
                      <th className="p-3 text-center">نصيب الأرباح</th>
                      <th className="p-3 text-center">العائد ROI%</th>
                      <th className="p-3 text-center">المسحوبات</th>
                      <th className="p-3 text-left">صافي المستحق</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                    {calculations.map((c) => (
                      <tr key={c.project_id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-bold text-white print:text-black">{c.project_name}</td>
                        <td className="p-3 text-center font-bold text-purple-400 print:text-black">
                          {c.investment_amount.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-center text-slate-300 print:text-black">
                          {c.project_total_budget.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20 print:border-none print:text-black">
                            {c.share_percentage}%
                          </span>
                        </td>
                        <td className="p-3 text-center text-slate-300 print:text-black">
                          {c.actual_project_cost.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-center font-semibold text-amber-400 print:text-black">
                          {c.partner_cost_share.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-center font-bold text-emerald-400 print:text-black">
                          {c.partner_profit_share.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-center font-bold text-purple-300 print:text-black font-mono">
                          {c.roi_percentage}%
                        </td>
                        <td className="p-3 text-center text-rose-400 print:text-black">
                          {c.total_distributed.toLocaleString()} ج.م
                        </td>
                        <td className="p-3 text-left font-extrabold text-emerald-400 print:text-black">
                          {c.net_balance_due.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Payouts and Distributions History */}
          {distributions.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-white print:text-black mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400 print:text-black" />
                <span>سجل توزيعات الأرباح والمسحوبات المدفوعة للشريك</span>
              </h4>

              <div className="overflow-x-auto rounded-xl border border-slate-800 print:border-black">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-800/80 text-slate-300 print:bg-slate-200 print:text-black font-bold">
                    <tr>
                      <th className="p-2.5">رقم السند</th>
                      <th className="p-2.5">تاريخ الصرف</th>
                      <th className="p-2.5">المشروع</th>
                      <th className="p-2.5">النوع</th>
                      <th className="p-2.5">طريقة الدفع</th>
                      <th className="p-2.5">الحساب المسحوب منه</th>
                      <th className="p-2.5 text-left">المبلغ المصروف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 print:divide-slate-300">
                    {distributions.map((d) => (
                      <tr key={d.id}>
                        <td className="p-2.5 font-mono text-slate-300 print:text-black font-bold">{d.distribution_number}</td>
                        <td className="p-2.5 text-slate-300 print:text-black">{d.distribution_date}</td>
                        <td className="p-2.5 text-slate-300 print:text-black">{d.project_name || 'عام'}</td>
                        <td className="p-2.5 text-slate-300 print:text-black">
                          {d.distribution_type === 'profit_payout' ? 'صرف أرباح' : d.distribution_type === 'withdrawal' ? 'مسحوبات' : 'استرداد رأس مال'}
                        </td>
                        <td className="p-2.5 text-slate-300 print:text-black">
                          {d.payment_method === 'cash' ? 'نقدي' : d.payment_method === 'bank_transfer' ? 'تحويل بنكي' : 'شيك'}
                        </td>
                        <td className="p-2.5 text-slate-300 print:text-black">{d.bank_account_name}</td>
                        <td className="p-2.5 text-left font-bold text-emerald-400 print:text-black">
                          {d.amount.toLocaleString()} ج.م
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Signature Block for Print */}
          <div className="hidden print:grid grid-cols-3 gap-6 mt-12 text-center text-xs font-bold pt-8 border-t border-slate-400">
            <div>
              <p className="mb-8">توقيع الشريك المستثمر</p>
              <p>.......................................</p>
            </div>
            <div>
              <p className="mb-8">المدير المالي وحسابات الشركاء</p>
              <p>.......................................</p>
            </div>
            <div>
              <p className="mb-8">اعتماد مجلس الإدارة</p>
              <p>.......................................</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
