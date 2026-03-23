import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Dashboard } from '@/components/Dashboard';
import { TasksList } from '@/components/TasksList';
import { SettingsDialog } from '@/components/SettingsDialog';
import { useAuth } from '@/hooks/useAuth';

type View = 'dashboard' | 'tasks';

const Index = () => {
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [currentView, setCurrentView] = useState<View>(isAdmin ? 'dashboard' : 'tasks');
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      <main className="container py-4 animate-fade-in">
        {currentView === 'dashboard' && isAdmin && <Dashboard />}
        {currentView === 'tasks' && <TasksList />}
        {currentView === 'dashboard' && !isAdmin && <TasksList />}
      </main>
      {isAdmin && <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />}
    </div>
  );
};

export default Index;
