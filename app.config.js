const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://79.137.192.194:3847';
const API_KEY = process.env.EXPO_PUBLIC_API_KEY || '';

export default {
  expo: {
    plugins: [
      ['expo-build-properties', {
        ios: {
          deploymentTarget: '15.1',
          useFrameworks: 'static',
        },
      }],
      [
        'expo-notifications',
        {
          icon: './assets/logo.png',
          color: '#9B59B6',
        },
      ],
    ],
    name: 'Косметолог Альбина',
    slug: 'kosmetolog-albina',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/logo.png',
    userInterfaceStyle: 'light',
    splash: {
      backgroundColor: '#9B59B6',
      image: './assets/logo.png',
      resizeMode: 'contain',
    },
    ios: {
      bundleIdentifier: 'com.albina.cosmetolog',
      supportsTablet: true,
      buildNumber: '1',
      infoPlist: {
        UIBackgroundModes: ['fetch', 'remote-notification'],
        LSApplicationQueriesSchemes: ['whatsapp'],
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    android: {
      package: 'com.albina.cosmetolog',
      adaptiveIcon: {
        foregroundImage: './assets/logo.png',
        backgroundColor: '#9B59B6',
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    owner: 'anatoliy_1302',
    extra: {
      eas: {
        projectId: '48214057-633c-4e6b-87bf-fe098d511cb9',
      },
      apiUrl: API_URL,
      apiKey: API_KEY,
    },
  },
};
