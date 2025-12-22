import Constants from 'expo-constants';

const apiFromEnv = Constants?.expoConfig?.extra?.apiUrl as string | undefined;

export const API_URL = apiFromEnv ?? 'http://e-commerce-social-app.onrender.com';
//e-commerce-social-app.onrender.com

// Giphy API Key - Get from https://developers.giphy.com/
// Add to your .env file as EXPO_PUBLIC_GIPHY_API_KEY
export const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY || '';

