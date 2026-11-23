import React, { useState, useEffect, useCallback } from 'react';
import { BackHandler, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { KEYS, load, save } from './src/storage';
import NeonBackground from './src/components/NeonBackground';
import { initSounds } from './src/sounds';
import { stash } from './src/removed';
import { loadSettings, useSettings, getSettings } from './src/settings';
import { initA11y } from './src/a11y';

import HomeScreen from './src/screens/HomeScreen';
import ParticipantsScreen from './src/screens/ParticipantsScreen';
import DrawNamesScreen from './src/screens/DrawNamesScreen';
import RouletteScreen from './src/screens/RouletteScreen';
import DiceScreen from './src/screens/DiceScreen';
import RaceScreen from './src/screens/RaceScreen';
import CoinScreen from './src/screens/CoinScreen';
import NumberScreen from './src/screens/NumberScreen';
import WhoStartsScreen from './src/screens/WhoStartsScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import ResultScreen from './src/screens/ResultScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';

import { tint } from './src/themes';
const SCREENS = {
  Home: HomeScreen,
  Participants: ParticipantsScreen,
  DrawNames: DrawNamesScreen,
  Roulette: RouletteScreen,
  Dice: DiceScreen,
  Race: RaceScreen,
  Coin: CoinScreen,
  NumberDraw: NumberScreen,
  WhoStarts: WhoStartsScreen,
  History: HistoryScreen,
  Result: ResultScreen,
  Settings: SettingsScreen,
  Welcome: WelcomeScreen,
};

export default function App() {
  // fonte Nunito (arredondada e gordinha) empacotada no app
  const [fontsLoaded] = useFonts({
    Nunito_900Black: require('./assets/fonts/Nunito_900Black.ttf'),
    Nunito_900Black_Italic: require('./assets/fonts/Nunito_900Black_Italic.ttf'),
    Nunito_800ExtraBold: require('./assets/fonts/Nunito_800ExtraBold.ttf'),
    Nunito_700Bold: require('./assets/fonts/Nunito_700Bold.ttf'),
  });
  // "pilha" de telas: a última é a que aparece
  const [stack, setStack] = useState([{ name: 'Home', params: {} }]);
  const [participants, setParticipants] = useState([]);
  const [history, setHistory] = useState([]);
  const [ready, setReady] = useState(false);
  useSettings(); // redesenha o app inteiro quando o idioma (ou outra configuração) muda

  // carrega dados salvos no aparelho ao abrir o app
  useEffect(() => {
    (async () => {
      await loadSettings(); // volume, efeitos de tela e idioma
      initSounds(); // prepara os sons
      initA11y();   // detecta o leitor de tela do celular
      if (!(await load(KEYS.welcome, false))) setStack([{ name: 'Welcome', params: {} }]); // primeira vez: boas-vindas
      setParticipants(await load(KEYS.participants, []));
      setHistory(await load(KEYS.history, []));
      setReady(true);
    })();
  }, []);

  // salva sempre que mudar
  useEffect(() => { if (ready) save(KEYS.participants, participants); }, [participants, ready]);
  useEffect(() => { if (ready) save(KEYS.history, history); }, [history, ready]);

  const navigate = (name, params = {}) => setStack((s) => [...s, { name, params }]);
  const replace = (name, params = {}) => setStack((s) => [...s.slice(0, -1), { name, params }]);
  const back = useCallback(() => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)), []);
  const reset = () => setStack([{ name: 'Home', params: {} }]);
  // fim das boas-vindas: grava que já viu; "sim" abre as Configurações (acessibilidade) por cima da Home
  const begin = (needsHelp) => {
    save(KEYS.welcome, true);
    setStack(needsHelp ? [{ name: 'Home', params: {} }, { name: 'Settings', params: { focus: 'a11y' } }] : [{ name: 'Home', params: {} }]);
  };
  const addHistory = (text, type) =>
    setHistory((h) => [{ id: String(Date.now()), text, type, date: new Date().toISOString() }, ...h].slice(0, 20));

  // botão voltar do Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) { back(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack, back]);

  // ao voltar para o início ou para os participantes, devolve a lista completa (se o usuário foi tirando os sorteados)
  const topName = stack[stack.length - 1].name;
  useEffect(() => {
    if ((topName === 'Home' || topName === 'Participants') && stash.all) {
      setParticipants(stash.all);
      stash.all = null;
    }
  }, [topName]);

  if (!ready || !fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bgBottom }} />;

  const current = stack[stack.length - 1];
  const Screen = SCREENS[current.name];

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: getSettings().profile === 'glass' ? tint('#241087') : colors.bgBottom }}>
        <NeonBackground />
        {getSettings().contrast && <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: tint('rgba(0,3,20,0.55)') }} />}
        <SafeAreaView style={{ flex: 1 }}>
          <Screen
            key={`${stack.length}-${current.name}`}
            params={current.params}
            navigate={navigate} replace={replace} back={back} reset={reset} begin={begin}
            participants={participants} setParticipants={setParticipants}
            history={history} addHistory={addHistory}
          />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}
