import React from 'react';
import { X, Printer, CheckCircle2, Building, Building2, CreditCard } from 'lucide-react';
import { InstallmentPaymentReceipt } from '../../types';

interface ReceiptPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: InstallmentPaymentReceipt | null;
}

export const ReceiptPrintModal: React.FC<ReceiptPrintModalProps> = ({
  isOpen,
  onClose,
  receipt,
}) => {
  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden" dir="rtl">
        {/* Actions bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">سند قبض مالي معتمد</span>
            <span className="text-xs font-bold text-amber-400">({receipt.receipt_number})</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-8 space-y-6 text-slate-900 printable-receipt bg-white relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">شركة البنيان للإنشاءات والتطوير العقاري</h2>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">القاهرة الجديدة - التجمع الخامس - جمهورية مصر العربية</p>
              <p className="text-xs text-slate-400">س.ت: 184920 | ب.ض: 549-218-301</p>
            </div>
            <div className="text-left" dir="ltr">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">OFFICIAL RECEIPT</div>
              <div className="text-base font-black text-slate-900">{receipt.receipt_number}</div>
              <div className="text-xs text-slate-600 mt-1">{receipt.payment_date}</div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center py-2 bg-slate-100 rounded-xl">
            <h3 className="text-base font-black text-slate-800">إيصال استلام نقدية / تحويل بنكي / شيك</h3>
          </div>

          {/* Body Information */}
          <div className="space-y-4 text-xs">
            <div className="flex items-baseline justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-500">وصلنا من السيد / السادة:</span>
              <span className="text-sm font-black text-slate-900">{receipt.client_name}</span>
            </div>

            <div className="flex items-baseline justify-between p-3 bg-slate-50/80 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-500">مبلغ وقدره بالأرقام:</span>
              <span className="text-base font-black text-emerald-700">{Number(receipt.amount_paid).toLocaleString()} ج.م</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="block font-semibold text-slate-500 mb-1">المشروع والبرج:</span>
                <span className="font-bold text-slate-800">{receipt.project_name} - {receipt.tower_name}</span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="block font-semibold text-slate-500 mb-1">بيانات الوحدة:</span>
                <span className="font-bold text-slate-800">وحدة رقم {receipt.unit_number}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="block font-semibold text-slate-500 mb-1">طريقة السداد:</span>
                <span className="font-bold text-blue-700">
                  {receipt.payment_method === 'cash' ? 'نقداً بالخزينة' : receipt.payment_method === 'bank_transfer' ? 'تحويل بنكي مباشر' : 'شيك بنكي'}
                </span>
              </div>
              <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                <span className="block font-semibold text-slate-500 mb-1">الحساب المودع به:</span>
                <span className="font-bold text-slate-800">{receipt.bank_account_name || 'الحساب البنكي المعتمد'}</span>
              </div>
            </div>

            {receipt.payment_method === 'cheque' && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 font-medium">
                <div className="font-bold mb-1">بيانات الشيك البنكي:</div>
                <div className="grid grid-cols-3 gap-2 text-[11px]">
                  <div>رقم الشيك: <span className="font-bold">{receipt.cheque_number}</span></div>
                  <div>البنك: <span className="font-bold">{receipt.cheque_bank_name || '-'}</span></div>
                  <div>تاريخ الاستحقاق: <span className="font-bold">{receipt.cheque_due_date || '-'}</span></div>
                </div>
                <div className="mt-1 text-[10px] text-amber-700">
                  * هذا الإيصال يعتبر لاغياً في حال عدم تحصيل قيمة الشيك من البنك المسحوب عليه.
                </div>
              </div>
            )}

            {receipt.payment_method === 'bank_transfer' && receipt.transfer_reference_number && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between">
                <span className="font-semibold text-slate-500">رقم الحوالة البنكية:</span>
                <span className="font-bold text-slate-800" dir="ltr">{receipt.transfer_reference_number}</span>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-200 text-center text-xs">
            <div>
              <p className="font-semibold text-slate-500">توقيع المستلم (قسم الحسابات)</p>
              <div className="mt-10 font-bold text-slate-800">{receipt.received_by_user_name || 'المحاسب المالي'}</div>
            </div>
            <div>
              <p className="font-semibold text-slate-500">خاتم الشركة واعتماد الإدارة</p>
              <div className="mt-6 inline-block w-20 h-20 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                ختم الشركة
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
