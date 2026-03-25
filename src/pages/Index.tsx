import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Dashboard } from '@/components/Dashboard';
import { TasksList } from '@/components/TasksList';
import { SettingsDialog } from '@/components/SettingsDialog';
import { BackupDialog } from '@/components/BackupDialog';
import { StatsDialog } from '@/components/StatsDialog';
import { AccountStatementDialog } from '@/components/AccountStatementDialog';
import { WhatsAppLogsDialog } from '@/components/WhatsAppLogsDialog';
import { useAuth } from '@/hooks/useAuth';

type View = 'dashboard' | 'tasks';

const Index = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [currentView, setCurrentView] = useState<View>(isAdmin ? 'dashboard' : 'tasks');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [whatsAppLogsOpen, setWhatsAppLogsOpen] = useState(false);
  const [initialFilter, setInitialFilter] = useState<string>('all');

  const handleFilterFromDashboard = (status: string) => {
    setInitialFilter(status);
    setCurrentView('tasks');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        currentView={currentView}
        onViewChange={(v) => { setCurrentView(v); if (v === 'tasks') setInitialFilter('all'); }}
        onSettingsOpen={() => setSettingsOpen(true)}
        onBackupOpen={() => setBackupOpen(true)}
        onStatsOpen={() => setStatsOpen(true)}
        onAccountOpen={() => setAccountOpen(true)}
      />
      <main className="container py-4 animate-fade-in">
        {currentView === 'dashboard' && isAdmin && <Dashboard onFilterTasks={handleFilterFromDashboard} />}
        {currentView === 'tasks' && <TasksList initialFilter={initialFilter} />}
        {currentView === 'dashboard' && !isAdmin && <TasksList initialFilter="all" />}
      </main>
      {isAdmin && (
        <>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
          <BackupDialog open={backupOpen} onOpenChange={setBackupOpen} />
          <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} />
          <AccountStatementDialog open={accountOpen} onOpenChange={setAccountOpen} />
        </>
      )}
    </div>
  );
};

export default Index;
