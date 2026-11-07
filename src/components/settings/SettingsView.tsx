import React, { useState, useRef } from 'react';
import { 
  Building2, 
  Database, 
  Save, 
  Coins, 
  Mail, 
  Phone, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Code2, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Download,
  Upload,
  Trash2,
  Lock
} from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { isSupabaseConfigured } from '../../lib/supabase';
import { FULL_POSTGRES_SCHEMA } from '../../lib/sqlSchema';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDemoData } = useSettings();
  const { user } = useAuth();
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [companyName, setCompanyName] = useState(settings.company_name);
  const [systemName, setSystemName] = useState(settings.system_name);
  const [defaultCurrency, setDefaultCurrency] = useState(settings.default_currency);
  const [companyEmail, setCompanyEmail] = useState(settings.email || settings.company_email || '');
  const [companyPhone, setCompanyPhone] = useState(settings.phone || settings.company_phone || '');
  const [companyAddress, setCompanyAddress] = useState(settings.address || settings.company_address || '');
  const [logoUrl, setLogoUrl] = useState(settings.logo_url || '');

  // Supabase keys
  const [supabaseUrl, setSupabaseUrl] = useState(settings.supabase_url || '');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState(settings.supabase_anon_key || '');

  const [isCopied, setIsCopied] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const isConnected = isSupabaseConfigured();

  // Check if current user is primary system admin
  const isPrimaryAdmin = user?.role_key === 'system_admin' || 
                         user?.email?.toLowerCase().startsWith('admin') ||
                         user?.id === 'user-admin-1' ||
                         user?.id === 'admin';

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      company_name: companyName,
      system_name: systemName,
      default_currency: defaultCurrency,
      email: companyEmail,
      company_email: companyEmail,
      phone: companyPhone,
      company_phone: companyPhone,
      address: companyAddress,
      company_address: companyAddress,
      logo_url: logoUrl,
      supabase_url: supabaseUrl,
      supabase_anon_key: supabaseAnonKey,
    }, user ? { id: user.id, full_name: user.full_name } : undefined);
    success('تم حفظ إعدادات الشركة وبيانات الربط بنجاح.');
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(FULL_POSTGRES_SCHEMA);
    setIsCopied(true);
    success('تم نسخ كود SQL Schema بالكامل إلى الحافظة.');
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handleResetData = () => {
    if (window.confirm('هل أنت متأكد من استعادة البيانات النموذجية الأولية؟ سيتم تحديث المشروعات والأبراج والمستخدمين.')) {
      setIsResetting(true);
      resetToDemoData();
      setTimeout(() => {
        setIsResetting(false);
        success('تمت استعادة البيانات النموذجية بنجاح.');
        window.location.reload();
      }, 500);
    }
  };

  // Full backup download
  const handleDownloadBackup = () => {
    try {
      const backupData: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('egypt_contracting_') || key.startsWith('elnokhba_'))) {
          backupData[key] = localStorage.getItem(key) || '';
        }
      }

      const jsonStr = JSON.stringify({
        appName: 'ElNokhba_Contracting_ERP',
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: user?.full_name || 'Admin',
        data: backupData,
      }, null, 2);

      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `backup_contracting_erp_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('تم تصدير وتنزيل النسخة الاحتياطية الكاملة بنجاح.');
    } catch (err) {
      console.error(err);
      error('حدث خطأ أثناء تنزيل النسخة الاحتياطية.');
    }
  };

  // Full backup upload / restore
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        const data = parsed.data || parsed;

        if (typeof data !== 'object') {
          throw new Error('ملف النسخة الاحتياطية غير صالح.');
        }

        let keysRestored = 0;
        Object.entries(data).forEach(([key, value]) => {
          if (typeof value === 'string') {
            localStorage.setItem(key, value);
            keysRestored++;
          }
        });

        if (keysRestored === 0) {
          throw new Error('لم يتم العثور على سجلات صالحة في الملف.');
        }

        success(`تمت استعادة ${keysRestored} جدول وسجل بنجاح! جاري إعادة التحميل...`);
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        console.error(err);
        error(err.message || 'فشلت استعادة النسخة الاحتياطية. يرجى التأكد من صحة الملف.');
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  // Primary Admin Wipe all data
  const handleWipeAllData = () => {
    if (!isPrimaryAdmin) {
      error('عذراً، هذه العملية مقصورة فقط على الأدمن الرئيسي للنظام.');
      return;
    }

    const firstConfirm = window.confirm(
      'تحذير أمني شديد الخطورة:\nهل أنت متأكد تماماً من رغبتك في مسح كافة بيانات البرنامج والبدء من الصفر؟\nسيتم حذف جميع المشروعات، الأبراج، الوحدات، المصروفات، المخازن، الأقساط، والموردين نهائياً!'
    );
    if (!firstConfirm) return;

    const code = window.prompt('لتأكيد المسح الشامل لكافة البيانات، يرجى كتابة كلمة "مسح" أو "DELETE":');
    if (code === 'مسح' || code === 'DELETE' || code === 'delete') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('egypt_contracting_') || k.startsWith('elnokhba_'))) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        success('تم مسح بيانات البرنامج بنجاح والعودة لحالة النظام النظيفة.');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        console.error(err);
        error('حدث خطأ أثناء مسح البيانات.');
      }
    } else {
      error('تم إلغاء عملية المسح لعدم تطابق كلمة التأكيد.');
    }
  };

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">
          الإعدادات العامة والربط البرمجي
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تخصيص هوية الشركة، العملة، الشعار، والربط مع قاعدة بيانات Supabase PostgreSQL
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Settings Form (7 cols) */}
        <form onSubmit={handleSaveCompanySettings} className="lg:col-span-7 space-y-6">
          {/* Card: Company Details */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>بيانات وهوية شركة التطوير العقاري</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-company-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                  اسم الشركة الرسمي <span className="text-rose-500">*</span>
                </label>
                <input
                  id="settings-company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="settings-system-name" className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان النظام في الواجهة <span className="text-rose-500">*</span>
                </label>
                <input
                  id="settings-system-name"
                  type="text"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-currency" className="block text-xs font-bold text-slate-700 mb-1.5">
                  العملة الافتراضية <span className="text-rose-500">*</span>
                </label>
                <select
                  id="settings-currency"
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="EGP">الجنيه المصري (EGP)</option>
                  <option value="USD">الدولار الأمريكي (USD)</option>
                  <option value="SAR">الريال السعودي (SAR)</option>
                  <option value="AED">الدرهم الإماراتي (AED)</option>
                </select>
              </div>

              <div>
                <label htmlFor="settings-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                  البريد الإلكتروني للشركة
                </label>
                <input
                  id="settings-email"
                  type="email"
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="settings-phone" className="block text-xs font-bold text-slate-700 mb-1.5">
                  رقم الهاتف الرئيسي
                </label>
                <input
                  id="settings-phone"
                  type="tel"
                  value={companyPhone}
                  onChange={(e) => setCompanyPhone(e.target.value)}
                  placeholder="+20 2 2345 6789"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label htmlFor="settings-address" className="block text-xs font-bold text-slate-700 mb-1.5">
                  عنوان المقر الرئيسي
                </label>
                <input
                  id="settings-address"
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  placeholder="التجمع الخامس، القاهرة، مصر"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: Supabase Connection Parameters */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <span>إعدادات الربط مع Supabase (PostgreSQL)</span>
              </h3>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>{isConnected ? 'متصل بـ Supabase' : 'وضع المعاينة المحلي'}</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              يمكنك إدخال بيانات مشروع Supabase الخاص بك للاتصال المباشر. كما يدعم النظام العمل التفاعلي الكامل حتى قبل إدخال المفاتيح.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="settings-supabase-url" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Supabase Project URL
                </label>
                <input
                  id="settings-supabase-url"
                  type="url"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label htmlFor="settings-supabase-anon-key" className="block text-xs font-bold text-slate-700 mb-1.5">
                  Supabase Anon (Public) Key
                </label>
                <input
                  id="settings-supabase-anon-key"
                  type="password"
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none text-left"
                  dir="ltr"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  * مفتاح Anon العام فقط. (لا تستخدم أبداً مفتاح Service Role Key في المتصفح للحفاظ على الأمان).
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="button"
              id="reset-demo-data-btn"
              onClick={handleResetData}
              disabled={isResetting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${isResetting ? 'animate-spin' : ''}`} />
              <span>استعادة البيانات النموذجية الأولية</span>
            </button>

            <button
              type="submit"
              id="save-settings-submit-btn"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-bold shadow-md shadow-blue-600/20 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>حفظ التغييرات</span>
            </button>
          </div>
        </form>

        {/* SQL Schema helper card & Backup / Danger Zone (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Backup & Restore Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              <span>النسخ الاحتياطي واستعادة البيانات</span>
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              يمكنك تصدير نسخة احتياطية كاملة من بيانات النظام (المشروعات، الأبراج، الوحدات، المخازن، الأقساط، والموردين) بصيغة JSON وحفظها بأمان، أو استعادتها في أي وقت.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Download Backup */}
              <button
                type="button"
                id="download-backup-btn"
                onClick={handleDownloadBackup}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>تنزيل نسخة احتياطية</span>
              </button>

              {/* Upload Backup */}
              <button
                type="button"
                id="upload-backup-btn"
                onClick={() => fileInputRef.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all"
              >
                <Upload className="w-4 h-4 text-blue-600" />
                <span>رفع نسخة احتياطية</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Primary Admin Only Danger Zone: Wipe All Data */}
          {isPrimaryAdmin && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-3xl p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <span>منطقة الخطر - خاصة بمدير النظام الرئيسي (Admin)</span>
              </div>
              <p className="text-xs text-rose-700 leading-relaxed">
                مسح شامل لكافة بيانات البرنامج والبدء من الصفر بقاعدة بيانات فارغة تماماً. هذا الإجراء نهائي ولا يمكن التراجع عنه إلا برفع نسخة احتياطية سابقة.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  id="wipe-all-data-btn"
                  onClick={handleWipeAllData}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>مسح بيانات البرنامج بالكامل والبدء من جديد</span>
                </button>
              </div>
            </div>
          )}

          {/* SQL Schema for Supabase Card */}
          <div className="bg-slate-900 text-slate-100 rounded-3xl p-6 sm:p-7 shadow-lg border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">
                  كود تهيئة PostgreSQL لـ Supabase
                </h3>
              </div>
              <button
                type="button"
                id="copy-sql-schema-btn"
                onClick={handleCopySchema}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors"
              >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'تم النسخ!' : 'نسخ SQL'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              انسخ هذا السكريبت البرمجي والصقه في <strong>SQL Editor</strong> داخل لوحة تحكم مشروعك في Supabase لتنفيذ الجداول وسياسات الحماية (RLS) وبيانات الأدوار الأولية بضغطة زر واحدة.
            </p>

            <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-80 overflow-y-auto" dir="ltr">
              <pre>{FULL_POSTGRES_SCHEMA.slice(0, 1200)}...
-- انقر على زر "نسخ SQL" لنسخ الكود بالكامل</pre>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>يتضمن RLS (Row Level Security) لكل جدول</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>مصفوفة الصلاحيات لـ 8 أدوار وظيفية جاهزة</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
