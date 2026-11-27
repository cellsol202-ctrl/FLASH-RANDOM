// Estilos da roleta e dos dados que o usuário pode escolher (pelo botão flutuante de paleta).
// A escolha fica salva nas configurações (wheelLook / diceLook); aqui ficam só as listas e o padrão de quem ainda não escolheu.
//   wheel: 'atual' | 'neon' | 'rubi' | 'arco' | 'laranja' | 'ouro'   (veja src/components/WheelArt.js)
//   dice:  'plastic' | 'neon' | 'cartoon' | 'gold'          (veja src/components/Dice3D.js; 'metal' também existe lá, mas fica fora do menu)
// Para mudar o estilo que aparece na primeira abertura do app, troque só DEFAULT_LOOKS.
export const DEFAULT_LOOKS = { wheel: 'atual', dice: 'plastic' };

// ordem em que os estilos aparecem no menu
export const LOOK_OPTIONS = {
  wheel: ['atual', 'neon', 'rubi', 'arco', 'laranja', 'ouro'],
  dice: ['plastic', 'neon', 'cartoon', 'gold'],
};

// chave de cada jogo nas configurações
export const LOOK_KEY = { wheel: 'wheelLook', dice: 'diceLook' };
