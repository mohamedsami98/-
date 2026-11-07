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
  wipeAllApplicationData: () => void;
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
        if (k.startsWith(prefix) || k.startsWith('elnokhba_')) {
          localStorage.removeItem(k);
        }
      });
      localStorage.removeItem('app_data_wiped_clean');
      initializeLocalStorage();
      setSettings(DEFAULT_COMPANY_SETTINGS);
      success('تمت استعادة البيانات النموذجية الأولية.');
    } catch (err) {
      console.error('Error resetting demo data', err);
    }
  };

  const wipeAllApplicationData = () => {
    try {
      // 1. Mark as wiped clean so re-seeders do not inject mock projects/expenses/etc.
      localStorage.setItem('app_data_wiped_clean', 'true');

      // 2. Set all business entities to clean empty arrays
      localStorage.setItem('egypt_contracting_projects', JSON.stringify([]));
      localStorage.setItem('egypt_contracting_towers', JSON.stringify([]));
      localStorage.setItem('egypt_contracting_activity_logs', JSON.stringify([]));

      localStorage.setItem('elnokhba_bank_accounts', JSON.stringify([]));
      localStorage.setItem('elnokhba_warehouses', JSON.stringify([]));
      localStorage.setItem('elnokhba_material_items', JSON.stringify([]));
      localStorage.setItem('elnokhba_inventory_transactions', JSON.stringify([]));
      localStorage.setItem('elnokhba_expenses', JSON.stringify([]));
      localStorage.setItem('elnokhba_tower_units', JSON.stringify([]));
      localStorage.setItem('elnokhba_contract_installments', JSON.stringify([]));
      localStorage.setItem('elnokhba_payment_receipts', JSON.stringify([]));
      localStorage.setItem('elnokhba_bank_transactions', JSON.stringify([]));
      localStorage.setItem('elnokhba_suppliers', JSON.stringify([]));
      localStorage.setItem('elnokhba_supplier_invoices', JSON.stringify([]));
      localStorage.setItem('elnokhba_supplier_payments', JSON.stringify([]));
      localStorage.setItem('elnokhba_partners', JSON.stringify([]));
      localStorage.setItem('elnokhba_partner_shares', JSON.stringify([]));
      localStorage.setItem('elnokhba_partner_distributions', JSON.stringify([]));

      // 3. Keep admin user intact so admin is not locked out
      const defaultUsers = [
        {
          id: 'user-admin-1',
          full_name: 'المهندس أحمد محمد الشرقاوي (مدير النظام)',
          email: 'admin@company.com',
          phone: '01001234567',
          role_id: 'role-admin',
          role_key: 'system_admin',
          role_name: 'مدير النظام الكامل (System Admin)',
          status: 'active',
          created_at: new Date().toISOString(),
        }
      ];
      localStorage.setItem('egypt_contracting_users', JSON.stringify(defaultUsers));
      localStorage.setItem('egypt_contracting_current_user_id', 'user-admin-1');

      success('تم مسح كافة بيانات النظام بالكامل بنجاح!');
    } catch (err) {
      console.error('Error wiping all application data', err);
      error('حدث خطأ أثناء مسح البيانات.');
      throw err;
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      loading, 
      updateSettings, 
      reloadSettings, 
      resetToDemoData,
      wipeAllApplicationData 
    }}>
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
