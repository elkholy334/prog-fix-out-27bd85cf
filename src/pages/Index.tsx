import { useState } from 'react';
import { AppHeader } from '@/components/AppHeader';
import { Dashboard } from '@/components/Dashboard';
import { TasksList } from '@/components/TasksList';
import { SettingsDialog } from '@/components/SettingsDialog';

type View = 'dashboard' | 'tasks';

const Index = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppHeader
        currentView={currentView}
        onViewChange={setCurrentView}
        onSettingsOpen={() => setSettingsOpen(true)}
      />
      <main className="container py-4 animate-fade-in">
        {currentView === 'dashboard' && <Dashboard />}
        {currentView === 'tasks' && <TasksList />}
      </main>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
};

export default Index;
