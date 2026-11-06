/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout/Layout';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProjectsList } from './components/projects/ProjectsList';
import { ProjectDetailView } from './components/projects/ProjectDetailView';
import { ProjectFormModal } from './components/projects/ProjectFormModal';
import { TowersList } from './components/towers/TowersList';
import { TowerFormModal } from './components/towers/TowerFormModal';
import { UsersList } from './components/users/UsersList';
import { UserFormModal } from './components/users/UserFormModal';
import { RolesPermissionsView } from './components/roles/RolesPermissionsView';
import { ActivityLogsView } from './components/activity/ActivityLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { CostsView } from './components/costs/CostsView';
import { InventoryView } from './components/inventory/InventoryView';
import { InstallmentsView } from './components/installments/InstallmentsView';
import { InstallmentReportsView } from './components/reports/InstallmentReportsView';
import { BankingView } from './components/banking/BankingView';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { Project, Tower, User } from './types';
import { dataService } from './lib/supabase';

function MainAppContent() {
  const { user, loading, refreshUserRole } = useAuth();
  const { success, error } = useToast();

  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modals state
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);

  const [isTowerModalOpen, setIsTowerModalOpen] = useState(false);
  const [towerToEdit, setTowerToEdit] = useState<Tower | null>(null);
  const [defaultTowerProjectId, setDefaultTowerProjectId] = useState<string | undefined>(undefined);

  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Refresh trigger for lists
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => setRefreshKey((prev) => prev + 1);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <LoadingSpinner message="جاري التحقق من الجلسة والصلاحيات..." />
      </div>
    );
  }

  // Not logged in -> Show Login Page
  if (!user) {
    return <LoginPage onSuccess={() => setCurrentView('dashboard')} />;
  }

  // Navigation handler
  const handleNavigate = (view: string) => {
    if (view === 'projects') {
      setSelectedProjectId(null);
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Project Modals
  const handleOpenNewProject = () => {
    setProjectToEdit(null);
    setIsProjectModalOpen(true);
  };

  const handleOpenEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsProjectModalOpen(true);
  };

  const handleProjectSubmit = async (projectData: any) => {
    try {
      if (projectToEdit) {
        await dataService.updateProject(projectToEdit.id, projectData, user);
        success(`تم تعديل مشروع "${projectData.name}" بنجاح.`);
      } else {
        await dataService.createProject(projectData, user);
        success(`تم إنشاء مشروع "${projectData.name}" بنجاح.`);
      }
      setIsProjectModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      error(err.message || 'فشلت عملية حفظ المشروع.');
      throw err;
    }
  };

  // Tower Modals
  const handleOpenNewTower = (projectId?: string) => {
    setTowerToEdit(null);
    setDefaultTowerProjectId(projectId);
    setIsTowerModalOpen(true);
  };

  const handleOpenEditTower = (tower: Tower) => {
    setTowerToEdit(tower);
    setDefaultTowerProjectId(tower.project_id);
    setIsTowerModalOpen(true);
  };

  const handleTowerSubmit = async (towerData: any) => {
    try {
      if (towerToEdit) {
        await dataService.updateTower(towerToEdit.id, towerData, user);
        success(`تم تحديث برج "${towerData.name}" بنجاح.`);
      } else {
        await dataService.createTower(towerData, user);
        success(`تم إضافة برج "${towerData.name}" بنجاح.`);
      }
      setIsTowerModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      error(err.message || 'فشلت عملية حفظ البرج.');
      throw err;
    }
  };

  // User Modals
  const handleOpenNewUser = () => {
    setUserToEdit(null);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setUserToEdit(u);
    setIsUserModalOpen(true);
  };

  const handleUserSubmit = async (userData: any) => {
    try {
      if (userToEdit) {
        await dataService.updateUser(userToEdit.id, userData, user);
        success(`تم تحديث بيانات المستخدم "${userData.full_name}" بنجاح.`);
      } else {
        await dataService.createUser(userData, user);
        success(`تمت إضافة المستخدم "${userData.full_name}" بنجاح.`);
      }
      setIsUserModalOpen(false);
      triggerRefresh();
    } catch (err: any) {
      error(err.message || 'فشلت عملية حفظ المستخدم.');
      throw err;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={handleNavigate}>
      {/* View router */}
      {currentView === 'dashboard' && (
        <DashboardView
          key={refreshKey}
          onNavigate={handleNavigate}
          onOpenNewProject={handleOpenNewProject}
          onOpenNewTower={() => handleOpenNewTower()}
          onSelectProject={handleSelectProject}
        />
      )}

      {currentView === 'projects' && (
        <ProjectsList
          key={refreshKey}
          onSelectProject={handleSelectProject}
          onOpenNewProjectModal={handleOpenNewProject}
          onOpenEditProjectModal={handleOpenEditProject}
        />
      )}

      {currentView === 'project-detail' && selectedProjectId && (
        <ProjectDetailView
          key={`${selectedProjectId}-${refreshKey}`}
          projectId={selectedProjectId}
          onBack={() => handleNavigate('projects')}
          onOpenNewTowerForProject={(projId) => handleOpenNewTower(projId)}
          onEditTower={handleOpenEditTower}
        />
      )}

      {currentView === 'towers' && (
        <TowersList
          key={refreshKey}
          onOpenNewTowerModal={() => handleOpenNewTower()}
          onOpenEditTowerModal={handleOpenEditTower}
          onSelectProject={handleSelectProject}
        />
      )}

      {currentView === 'costs' && (
        <CostsView key={refreshKey} />
      )}

      {currentView === 'inventory' && (
        <InventoryView key={refreshKey} />
      )}

      {currentView === 'installments' && (
        <InstallmentsView key={refreshKey} />
      )}

      {currentView === 'reports' && (
        <InstallmentReportsView key={refreshKey} onNavigate={handleNavigate} />
      )}

      {currentView === 'banking' && (
        <BankingView key={refreshKey} />
      )}

      {currentView === 'users' && (
        <UsersList
          key={refreshKey}
          onOpenNewUserModal={handleOpenNewUser}
          onOpenEditUserModal={handleOpenEditUser}
        />
      )}

      {currentView === 'roles_permissions' && (
        <RolesPermissionsView key={refreshKey} />
      )}

      {currentView === 'activity_logs' && (
        <ActivityLogsView key={refreshKey} />
      )}

      {currentView === 'settings' && (
        <SettingsView />
      )}

      {/* Global Modals */}
      <ProjectFormModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectSubmit}
        projectToEdit={projectToEdit}
      />

      <TowerFormModal
        isOpen={isTowerModalOpen}
        onClose={() => setIsTowerModalOpen(false)}
        onSubmit={handleTowerSubmit}
        towerToEdit={towerToEdit}
        defaultProjectId={defaultTowerProjectId}
      />

      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleUserSubmit}
        userToEdit={userToEdit}
      />
    </Layout>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <SettingsProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </SettingsProvider>
    </ToastProvider>
  );
}
