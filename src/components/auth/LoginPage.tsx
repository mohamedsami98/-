import React, { useState } from 'react';
import { HardHat, Lock, Mail, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';

interface LoginPageProps {
  onSuccess?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess }) => {
  const { signIn, loading } = useAuth();
  const { settings } = useSettings();

  const [email, setEmail] = useState('admin@company.com');
  const [password, setPassword] = useState('admin123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await signIn(email, password);
      if (ok && onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (testEmail: string) => {
    setEmail(testEmail);
    setPassword('password123');
    setErrorMsg('');
  };

  return (
    <div 
      id="login-page-container"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* Decorative Architectural Grid Pattern in background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 mb-4">
            <HardHat className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {settings.company_name || 'شركة المقاولات والتطوير العقاري'}
          </h1>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            {settings.system_name || 'بوابة إدارة المشروعات والأبراج الإنشائية'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-700/30">
          <div className="mb-6 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              تسجيل الدخول إلى النظام
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              أدخل بيانات حسابك المعتمد للدخول إلى لوحة التحكم
            </p>
          </div>

          {errorMsg && (
            <div 
              id="login-error-alert"
              className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed"
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="login-email-input" 
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                البريد الإلكتروني <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="login-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left placeholder:text-right"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="login-password-input" 
                className="block text-xs font-bold text-slate-700 mb-1.5"
              >
                كلمة المرور <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-left placeholder:text-right"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="login-submit-btn"
              disabled={isSubmitting || loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {(isSubmitting || loading) ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts Helper */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>حسابات تجريبية سريعة للاختبار:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="demo-login-admin"
                onClick={() => handleQuickLogin('admin@company.com')}
                className="p-2 text-right rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                <div className="text-blue-600">مدير النظام</div>
                <div className="text-slate-400 text-[10px]">admin@company.com</div>
              </button>
              <button
                type="button"
                id="demo-login-manager"
                onClick={() => handleQuickLogin('manager@company.com')}
                className="p-2 text-right rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                <div className="text-emerald-600">مدير الشركة</div>
                <div className="text-slate-400 text-[10px]">manager@company.com</div>
              </button>
              <button
                type="button"
                id="demo-login-pm"
                onClick={() => handleQuickLogin('pm@company.com')}
                className="p-2 text-right rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                <div className="text-amber-600">مدير المشروع</div>
                <div className="text-slate-400 text-[10px]">pm@company.com</div>
              </button>
              <button
                type="button"
                id="demo-login-accountant"
                onClick={() => handleQuickLogin('accountant@company.com')}
                className="p-2 text-right rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-700 transition-colors"
              >
                <div className="text-purple-600">المحاسب</div>
                <div className="text-slate-400 text-[10px]">accountant@company.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge note */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>نظام مشفر ومحمي بواسطة Supabase Authentication & PostgreSQL RLS</span>
        </div>
      </div>
    </div>
  );
};
