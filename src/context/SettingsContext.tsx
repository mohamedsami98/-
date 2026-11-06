import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CompanySettings } from '../types';
import { dataService, DEFAULT_COMPANY_SETTINGS, initializeLocalStorage } from '../lib/supabase';
import { useToast } from './ToastContext';

interface SettingsContextType {
  settings: CompanySettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<CompanySettings>, user?: { id: string; full_name: string }) => Promise<void>;
  reloadSettings: () => Promise<void>;
  resetToDemoData: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_COMPANY_SETTINGS);
  const [loading, setLoading] = useState<boolean>(true);
  const { success, error } = useToast();

  const reloadSettings = async () => {
    try {
      const data = await dataService.getCompanySettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load company settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reloadSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<CompanySettings>, user?: { id: string; full_name: string }) => {
    try {
      const activeUser = user || { id: 'admin', full_name: 'مدير النظام' };
      const updated = await dataService.updateCompanySettings(newSettings, activeUser);
      setSettings(updated);
      success('تم حفظ إعدادات الشركة بنجاح.');
    } catch (err: any) {
      console.error('Failed to update company settings', err);
      error(err.message || 'حدث خطأ أثناء حفظ البيانات، يرجى المحاولة مرة أخرى.');
      throw err;
    }
  };

  const resetToDemoData = () => {
    try {
      const prefix = 'egypt_contracting_';
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(prefix)) {
          localStorage.removeItem(k);
        }
      });
      initializeLocalStorage();
      setSettings(DEFAULT_COMPANY_SETTINGS);
      success('تمت استعادة البيانات النموذجية الأولية.');
    } catch (err) {
      console.error('Error resetting demo data', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, reloadSettings, resetToDemoData }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
