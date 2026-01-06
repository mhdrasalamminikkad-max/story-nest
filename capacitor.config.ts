import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tellmamma.app',
  appName: 'Tell Mamma',
  webDir: 'dist/public',
  server: {
    // Point to hosted production URL
    url: 'https://tellmamma.com',
    cleartext: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
  },
};

export default config;
