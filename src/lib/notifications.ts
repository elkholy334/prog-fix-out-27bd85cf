import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { App } from '@capacitor/app';
import { Badge } from '@capawesome/capacitor-badge';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type TaskRow = Database['public']['Tables']['tasks']['Row'];

const SEEN_KEY = 'seen_task_ids';
const BADGE_KEY = 'unseen_badge_count';
let initialized = false;

const isNative = () => Capacitor.isNativePlatform();

const getSeenIds = (): Set<number> => {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch { return new Set(); }
};
const saveSeenIds = (set: Set<number>) => {
  const arr = Array.from(set).slice(-500); // cap to last 500
  localStorage.setItem(SEEN_KEY, JSON.stringify(arr));
};

const setBadge = async (count: number) => {
  localStorage.setItem(BADGE_KEY, String(count));
  if (isNative()) {
    try {
      const supported = await Badge.isSupported();
      if (supported.isSupported) {
        if (count > 0) await Badge.set({ count });
        else await Badge.clear();
      }
    } catch { /* ignore */ }
  }
  // Web badging API (PWA on Android Chrome supports this)
  const nav: any = navigator;
  try {
    if ('setAppBadge' in nav)   await nav.setAppBadge(count > 0 ? count : 0);
    else if ('clearAppBadge' in nav && count === 0) await nav.clearAppBadge();
  } catch { /* ignore */ }
};

export const getBadgeCount = (): number => {
  return Number(localStorage.getItem(BADGE_KEY) || '0');
};

export const clearBadge = async () => {
  await setBadge(0);
};

const fireNotification = async (task: TaskRow) => {
  const title = '🛠️ مهمة جديدة';
  const body  = `${task.client_name} — ${task.type || 'مهمة جديدة'}`;

  if (isNative()) {
    try {
      const perm = await LocalNotifications.checkPermissions();
      if (perm.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        if (req.display !== 'granted') return;
      }
      await LocalNotifications.schedule({
        notifications: [{
          id: task.id,
          title, body,
          schedule: { at: new Date(Date.now() + 500) },
          extra: { taskId: task.id },
        }],
      });
    } catch (e) { console.error('Native notify failed:', e); }
  } else if ('Notification' in window) {
    try {
      if (Notification.permission === 'default') await Notification.requestPermission();
      if (Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icon-192.png', tag: `task-${task.id}` });
      }
    } catch { /* ignore */ }
  }
};

export const initTaskNotifications = async () => {
  if (initialized) return;
  initialized = true;

  // Ask permission upfront
  if (isNative()) {
    try { await LocalNotifications.requestPermissions(); } catch { /* ignore */ }
    try { await Badge.requestPermissions(); } catch { /* ignore */ }
  } else if ('Notification' in window && Notification.permission === 'default') {
    try { await Notification.requestPermission(); } catch { /* ignore */ }
  }

  // Seed seen set with existing tasks so we don't notify on first load
  const { data: existing } = await (supabase as any).from('tasks_view').select('id');
  const seen = getSeenIds();
  (existing || []).forEach(t => seen.add(t.id));
  saveSeenIds(seen);
  await setBadge(0);

  // Subscribe to realtime inserts
  supabase
    .channel('tasks-notify')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tasks' }, async (payload) => {
      const task = payload.new as TaskRow;
      const seen = getSeenIds();
      if (seen.has(task.id)) return;
      seen.add(task.id);
      saveSeenIds(seen);
      const next = getBadgeCount() + 1;
      await setBadge(next);
      await fireNotification(task);
    })
    .subscribe();

  // Clear badge when app comes back to foreground
  if (isNative()) {
    try {
      App.addListener('appStateChange', async (s) => {
        if (s.isActive) await clearBadge();
      });
    } catch { /* ignore */ }
  } else {
    document.addEventListener('visibilitychange', async () => {
      if (document.visibilityState === 'visible') await clearBadge();
    });
  }
};
