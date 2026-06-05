import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { TasksList } from '@/components/TasksList';
import { SettingsDialog } from '@/components/SettingsDialog';
import { BackupDialog } from '@/components/BackupDialog';
import { StatsDialog } from '@/components/StatsDialog';
import { TechnicianAccountDialog } from '@/components/TechnicianAccountDialog';
import { WhatsAppLogsDialog } from '@/components/WhatsAppLogsDialog';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [backupOpen, setBackupOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [whatsAppLogsOpen, setWhatsAppLogsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        currentView="tasks"
        onViewChange={() => {}}
        onSettingsOpen={() => setSettingsOpen(true)}
        onBackupOpen={() => setBackupOpen(true)}
        onStatsOpen={() => setStatsOpen(true)}
        onAccountOpen={() => setAccountOpen(true)}
        onWhatsAppLogsOpen={() => setWhatsAppLogsOpen(true)}
      />
      <main className="container py-4 animate-fade-in">
        <TasksList initialFilter="all" />
      </main>
      {isAdmin && (
        <>
          <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
          <BackupDialog open={backupOpen} onOpenChange={setBackupOpen} />
          <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} />
          <TechnicianAccountDialog open={accountOpen} onOpenChange={setAccountOpen} />
          <WhatsAppLogsDialog open={whatsAppLogsOpen} onOpenChange={setWhatsAppLogsOpen} />
        </>
      )}
    </div>
  );
};

export default Index;
