import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryEntry } from './types';

const KEY_URL = 'sigma.baseUrl';
const KEY_API = 'sigma.apiKey';
const KEY_HISTORY = 'sigma.history';
const HISTORY_LIMIT = 50;

export interface Settings {
  baseUrl: string;
  apiKey: string;
}

export async function loadSettings(): Promise<Settings> {
  const [baseUrl, apiKey] = await Promise.all([
    SecureStore.getItemAsync(KEY_URL),
    SecureStore.getItemAsync(KEY_API),
  ]);
  return { baseUrl: baseUrl ?? '', apiKey: apiKey ?? '' };
}

export async function persistSettings(settings: Settings): Promise<void> {
  await SecureStore.setItemAsync(KEY_URL, settings.baseUrl);
  await SecureStore.setItemAsync(KEY_API, settings.apiKey);
}

export async function getHistory(): Promise<HistoryEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_HISTORY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export async function addHistory(entry: HistoryEntry): Promise<void> {
  const current = await getHistory();
  const next = [entry, ...current.filter((e) => e.id !== entry.id)].slice(0, HISTORY_LIMIT);
  await AsyncStorage.setItem(KEY_HISTORY, JSON.stringify(next));
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(KEY_HISTORY);
}

const PRIVATE_HOST =
  /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+|[^/]+\.local)$/i;

export function validateBaseUrl(value: string): string | null {
  const match = value.trim().match(/^(https?):\/\/([^/:]+)(:\d+)?(\/.*)?$/i);
  if (!match) return 'Escribe una URL válida, por ejemplo https://servicio.ejemplo.mx';
  const [, scheme, host] = match;
  if (scheme.toLowerCase() === 'http' && !PRIVATE_HOST.test(host)) {
    return 'Fuera de la red local el servicio debe usar HTTPS.';
  }
  return null;
}
