import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tellmamma.app',
  appName: 'Tell Mamma',
  webDir: 'dist/public',
  server: {
    // For local development - comment out when building for production
    // url: 'https://tellmamma.com',
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
