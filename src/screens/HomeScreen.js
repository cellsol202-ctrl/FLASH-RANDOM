import React from 'react';
import { useSounds } from '../sounds';
import { useSettings } from '../settings';
import HomeNormal from './home/HomeNormal';
import HomeGlass from './home/HomeGlass';

// A Home tem 2 visuais ("perfis"), escolhidos em Configurações > Perfil: Normal e Vidro. Os modos e a navegação são os mesmos.
export default function HomeScreen({ navigate }) {
  useSounds('global'); // Home usa o toque padrão
  const { profile } = useSettings();
  if (profile === 'glass') return <HomeGlass navigate={navigate} />;
  return <HomeNormal navigate={navigate} />;
}
