import React, { useState } from 'react';
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
  ShieldAlert
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

        {/* SQL Schema helper card (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
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
