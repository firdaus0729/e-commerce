import Constants from 'expo-constants';

// Priority: build/runtime env -> expo config extra -> browser location -> fallback
const buildEnvApi = (process.env.EXPO_PUBLIC_API_URL as string | undefined) || undefined;
const expoExtraApi = (Constants?.expoConfig?.extra?.apiUrl as string | undefined) || undefined;
let runtimeApi: string | undefined = undefined;
if (typeof window !== 'undefined' && window.location) {
	runtimeApi = `${window.location.protocol}//${window.location.host}`;
}

const rawApi = buildEnvApi ?? expoExtraApi ?? runtimeApi ?? 'https://e-commerce-social-app.onrender.com';
// Normalize: remove trailing slash
console.log(rawApi.replace(/\/+$/, ''));
export const API_URL = rawApi.replace(/\/+$/, '');

// Giphy API Key - Get from https://developers.giphy.com/
// Add to your .env or EAS/Expo build config as EXPO_PUBLIC_GIPHY_API_KEY
export const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY || '';

