import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  participants: '@flash/participants',
  history: '@flash/history',
  sound: '@flash/sound',       // (antigo) som ligado/desligado
  settings: '@flash/settings', // volume, efeitos de tela e idioma
  welcome: '@flash/welcome',   // já viu a tela de boas-vindas (primeira abertura)
};

export async function load(key, fallback) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

export async function save(key, value) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // falha de armazenamento não deve derrubar o app
  }
}
