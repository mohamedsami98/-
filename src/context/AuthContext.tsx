import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  UserProfile, 
  Role, 
  SystemModule, 
  PermissionAction 
} from '../types';
import { 
  getSupabaseClient, 
  dataService, 
  DEFAULT_USERS, 
  DEFAULT_ROLES, 
  DEFAULT_ROLE_PERMISSION_CODES,
  ALL_PERMISSIONS 
} from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: UserProfile | null;
  role: Role | null;
  loading: boolean;
  permissions: string[];
  signIn: (email: string, pass: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signUp: (email: string, pass: string, fullName: string, phone: string, roleId: string) => Promise<boolean>;
  hasPermission: (module: SystemModule, action: PermissionAction) => boolean;
  canAccessModule: (module: SystemModule) => boolean;
  switchDemoUser: (userId: string) => Promise<void>;
  reloadUserPermissions: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'egypt_contracting_current_user_id';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { success, error } = useToast();

  const loadUserAndPermissions = useCallback(async (targetUserId?: string) => {
    try {
      const supabase = getSupabaseClient();
      let activeUserId = targetUserId || localStorage.getItem(CURRENT_USER_KEY);

      // If connected to Supabase Auth, check session
      if (supabase && !targetUserId) {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          activeUserId = sessionData.session.user.id;
        }
      }

      const allUsers = await dataService.getUsers();
      const allRoles = await dataService.getRoles();
      const rolePermissionsMap = await dataService.getRolePermissionsMap();

      if (!activeUserId && allUsers.length > 0) {
        // By default on initial local open, user can log in or start with admin for preview
        activeUserId = allUsers[0].id;
      }

      const foundUser = allUsers.find((u) => u.id === activeUserId) || null;

      if (foundUser) {
        setUser(foundUser);
        const userRole = allRoles.find((r) => r.id === foundUser.role_id) || DEFAULT_ROLES[0];
        setRole(userRole);

        // System Admin always gets full permissions
        if (userRole.key === 'system_admin') {
          setPermissions(ALL_PERMISSIONS.map((p) => p.code));
        } else {
          const roleCodes = rolePermissionsMap[userRole.id] || 
                             rolePermissionsMap[userRole.key] || 
                             DEFAULT_ROLE_PERMISSION_CODES[userRole.key] || 
                             [];
          setPermissions(roleCodes);
        }
      } else {
        setUser(null);
        setRole(null);
        setPermissions([]);
      }
    } catch (err) {
      console.error('Failed to load user and permissions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUserAndPermissions();

    // Listen to Supabase auth state change if available
    const supabase = getSupabaseClient();
    if (supabase) {
      const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await loadUserAndPermissions(session.user.id);
        } else if (!localStorage.getItem(CURRENT_USER_KEY)) {
          setUser(null);
          setRole(null);
          setPermissions([]);
        }
      });

      return () => {
        sub.subscription.unsubscribe();
      };
    }
  }, [loadUserAndPermissions]);

  const signIn = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
      const supabase = getSupabaseClient();

      if (supabase) {
        const { data, error: authErr } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: pass,
        });

        if (authErr) {
          error(authErr.message || 'فشل تسجيل الدخول، تأكد من صحة البريد الإلكتروني وكلمة المرور.');
          setLoading(false);
          return false;
        }

        if (data.user) {
          localStorage.setItem(CURRENT_USER_KEY, data.user.id);
          await loadUserAndPermissions(data.user.id);
          success('تم تسجيل الدخول بنجاح، مرحباً بك في النظام.');
          return true;
        }
      }

      // Local / Offline authentication fallback
      const users = await dataService.getUsers();
      const matched = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());

      if (!matched) {
        error('البريد الإلكتروني غير مسجل في النظام.');
        setLoading(false);
        return false;
      }

      if (matched.status === 'inactive') {
        error('هذا الحساب معطل حالياً. يرجى مراجعة مدير النظام.');
        setLoading(false);
        return false;
      }

      // Update last sign in
      matched.last_sign_in_at = new Date().toISOString();
      await dataService.updateUser(matched.id, { last_sign_in_at: matched.last_sign_in_at }, matched);

      localStorage.setItem(CURRENT_USER_KEY, matched.id);
      await loadUserAndPermissions(matched.id);
      await dataService.logActivity(matched, 'auth', 'auth', `قام ${matched.full_name} بتسجيل الدخول إلى النظام.`, matched.id);

      success('تم تسجيل الدخول بنجاح، مرحباً بك.');
      return true;
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء تسجيل الدخول، يرجى المحاولة مرة أخرى.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      const supabase = getSupabaseClient();
      if (supabase) {
        await supabase.auth.signOut();
      }

      if (user) {
        await dataService.logActivity(user, 'auth', 'auth', `قام ${user.full_name} بتسجيل الخروج.`);
      }

      localStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
      setRole(null);
      setPermissions([]);
      success('تم تسجيل الخروج بنجاح.');
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, phone: string, roleId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const currentUser = user || { id: 'admin', full_name: 'مدير النظام' };
      const created = await dataService.createUser({
        full_name: fullName,
        email,
        phone,
        role_id: roleId,
        status: 'active',
      }, pass, currentUser);

      success(`تم إنشاء حساب ${created.full_name} بنجاح.`);
      return true;
    } catch (err: any) {
      error(err.message || 'حدث خطأ أثناء إنشاء المستخدم.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const switchDemoUser = async (userId: string) => {
    setLoading(true);
    localStorage.setItem(CURRENT_USER_KEY, userId);
    await loadUserAndPermissions(userId);
    success('تم التبديل إلى المستخدم المختار لتجربة الصلاحيات.');
  };

  const reloadUserPermissions = async () => {
    if (user) {
      await loadUserAndPermissions(user.id);
    }
  };

  const hasPermission = useCallback((module: SystemModule, action: PermissionAction): boolean => {
    if (!user) return false;
    if (role?.key === 'system_admin') return true;
    const requiredCode = `${module}:${action}`;
    return permissions.includes(requiredCode);
  }, [user, role, permissions]);

  const canAccessModule = useCallback((module: SystemModule): boolean => {
    if (!user) return false;
    if (role?.key === 'system_admin') return true;
    return hasPermission(module, 'view');
  }, [user, role, hasPermission]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        permissions,
        signIn,
        signOut,
        signUp,
        hasPermission,
        canAccessModule,
        switchDemoUser,
        reloadUserPermissions,
        refreshUserRole: reloadUserPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
