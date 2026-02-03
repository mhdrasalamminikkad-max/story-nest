import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.storynest.kidslauncher',
  appName: 'StoryNest Kids',
  webDir: 'dist',
  // Removed server URL to ensure it runs from local files (offline ready)
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
