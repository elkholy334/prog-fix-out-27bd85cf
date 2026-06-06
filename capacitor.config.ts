import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.72b4a8a740c541fda98b8059f81946e8',
  appName: 'تركيبات الفيروز',
  webDir: 'dist',
  server: {
    url: 'https://72b4a8a7-40c5-41fd-a98b-8059f81946e8.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#1e88e5',
      sound: 'default',
    },
    Badge: {
      persist: true,
      autoClear: false,
    },
  },
};

export default config;
