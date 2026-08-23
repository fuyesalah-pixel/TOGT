import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.togt.travel',
  appName: 'TOGT Tour & Travel',
  webDir: 'public',
  server: {
    url: 'https://travel.togttrading.com',
    androidScheme: 'https',
  }
};

export default config;
