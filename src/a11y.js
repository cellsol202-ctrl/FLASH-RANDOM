import { Vibration, AccessibilityInfo } from 'react-native';
import * as Speech from 'expo-speech';
import { getSettings } from './settings';
import { locale } from './i18n';

// Ajudantes de acessibilidade.

// Vibração só se estiver ligada nas Configurações (quem não quer vibração desliga lá).
export function vibrate(ms) {
  if (getSettings().haptics === false) return;
  Vibration.vibrate(ms);
}

// Leitor de tela do sistema (TalkBack): quando ligado, ele mesmo cuida da fala.
let screenReader = false;
export function initA11y() {
  try {
    AccessibilityInfo.isScreenReaderEnabled().then((v) => { screenReader = !!v; }).catch(() => {});
    AccessibilityInfo.addEventListener('screenReaderChanged', (v) => { screenReader = !!v; });
  } catch (e) { /* ignora */ }
}

// Fala um aviso (resultado, aviso...). Com TalkBack ligado, usa o anúncio dele; senão, a voz do app (se a narração estiver ligada).
export function announce(text) {
  if (!text) return;
  try {
    if (screenReader) { AccessibilityInfo.announceForAccessibility(text); return; }
    if (!getSettings().voice) return;
    Speech.stop();
    Speech.speak(text, { language: locale(), rate: 0.95 });
  } catch (e) { /* ignora */ }
}

export function stopSpeaking() { try { Speech.stop(); } catch (e) { /* ignora */ } }
