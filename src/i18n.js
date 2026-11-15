import { getSettings } from './settings';

// Textos do app em 4 idiomas. Uso: t('dice.win', { name: 'Ana', max: 6 }).
// {nome} dentro do texto é trocado pelo valor passado. Se faltar tradução, cai no português.
export const LANG_NAMES = { pt: 'Português', en: 'English', es: 'Español', de: 'Deutsch' };
export const LOCALES = { pt: 'pt-BR', en: 'en-US', es: 'es-ES', de: 'de-DE' };

const pt = {
  'home.tagline': 'Mais que sorte, é a emoção de ganhar!',
  'home.title': 'Qual sorteio você quer fazer?',
  'home.history': 'HISTÓRICO',
  'mode.names': 'Sorteio de nomes', 'mode.roulette': 'Roleta', 'mode.dice': 'Dados', 'mode.race': 'Corrida de bolinhas', 'mode.sticks': 'Palitinho',
  'modeSub.names': 'Os raios escolhem quem vence',
  'modeSub.roulette': 'Gire e descubra quem ganha',
  'modeSub.dice': 'O maior número vence',
  'modeSub.race': 'A primeira a chegar vence',

  'part.title': 'Quem vai participar?',
  'part.sub': 'Adicione os nomes de quem vai entrar no sorteio.',
  'part.sub.dice': 'Cada participante ganha um dado colorido (máx. {max}).',
  'part.sub.race': 'Cada participante vira uma bolinha colorida (máx. {max}).',
  'part.placeholder': 'Nome do participante',
  'part.add': 'ADICIONAR',
  'part.list': 'Participantes',
  'part.empty': 'Nenhum participante ainda. Mínimo de 2 para sortear.',
  'part.warn.dice': 'Para dados, remova até ficar com {max} participantes.',
  'part.warn.race': 'Para a corrida, remova até ficar com {max} participantes.',
  'part.next': 'CONTINUAR',
  'part.dupTitle': 'Nome repetido', 'part.dupMsg': 'Esse nome já está na lista.',
  'part.clearTitle': 'Limpar lista', 'part.clearMsg': 'Remover todos os participantes?',
  'part.cancel': 'Cancelar', 'part.clear': 'Limpar',

  'names.title': 'Sorteando...', 'names.sub': 'A emoção já está no ar!', 'names.info': 'Sorteando entre {n} participantes',

  'roulette.sub': '{n} participantes na roda', 'roulette.spin': 'GIRAR', 'roulette.spinning': 'GIRANDO...',

  'dice.idle': 'Cada pessoa joga um dado. O maior número vence!',
  'dice.round': 'Rodada {n}', 'dice.tiebreak': 'Rodada {n} · desempate',
  'dice.hint': 'Toque no tabuleiro para rolar os dados!',
  'dice.colorHint': 'Segure seu nome para trocar a cor do dado', 'dice.colorOf': 'Cor de {name}', 'dice.colorSlide': 'Deslize para os lados e solte', 'dice.roll': 'ROLAR DADOS',
  'dice.win': '{name} venceu com {max}!', 'dice.tie': 'Empate com {max}! Desempate já!', 'dice.rounds': '{n} rodadas',

  'race.idle': 'Quem chegar primeiro vence. Cuidado: os raios eliminam!',
  'race.zap': 'Um raio atingiu {name}!',
  'race.ready': 'Preparar...', 'race.racing': 'Valendo!', 'race.done': 'Fim de corrida!',
  'race.hint': 'Toque em LARGADA para começar!', 'race.go': 'JÁ!', 'race.win': '{name} venceu a corrida!',
  'race.start': 'LARGADA!', 'race.readyBtn': 'PREPARAR...', 'race.running': 'CORRENDO...',


  'mode.bomb': 'Bomba-relógio', 'mode.coin': 'Cara ou coroa',
  'modeSub.bomb': 'Quem ficar com a bomba sai', 'modeSub.coin': 'Dois lados: a moeda decide',
  'part.sub.bomb': 'Todos entram na roda da bomba (máx. {max}).', 'part.warn.bomb': 'Para a bomba, remova até ficar com {max} participantes.',
  'part.sub.coin': 'Só 2 participantes: o primeiro é cara, o segundo é coroa.', 'part.warn.coin': 'Para cara ou coroa, deixe só {max} participantes.',
  'bomb.idle': 'A bomba passa de mão em mão. Quem estiver com ela no estouro sai!',
  'bomb.round': 'Rodada {n} · restam {k}', 'bomb.hint': 'Toque para acender o pavio!',
  'bomb.start': 'ACENDER O PAVIO', 'bomb.passing': 'PASSANDO...', 'bomb.over': 'FIM!',
  'bomb.boom': 'A bomba estourou com {name}!', 'bomb.win': '{name} sobreviveu!',
  'coin.idle': '{a} é cara, {b} é coroa.', 'coin.hint': 'Toque na moeda para jogar!',
  'coin.start': 'JOGAR A MOEDA', 'coin.flipping': 'GIRANDO...', 'coin.flipping2': 'Girando...',
  'coin.heads': 'Cara', 'coin.tails': 'Coroa', 'coin.result': 'Deu {face}! {name} venceu!',

  'result.title': 'Resultado do sorteio', 'result.champion': '1º LUGAR', 'result.label': 'Quem venceu foi',
  'result.again': 'SORTEAR NOVAMENTE', 'result.new': 'NOVO SORTEIO',
  'share.button': 'COMPARTILHAR', 'share.preparing': 'PREPARANDO...', 'share.title': 'Compartilhar resultado', 'share.error': 'Não foi possível compartilhar agora.', 'share.participants': 'Participantes ({n})',

  'history.title': 'Histórico', 'history.sub': 'Seus últimos sorteios ({n} de 20)',
  'history.emptyTitle': 'Nenhum sorteio ainda', 'history.emptySub': 'Faça um sorteio e o resultado aparece aqui.',

  'settings.profile': 'Perfil', 'settings.profileSub': 'Escolha o visual da tela inicial', 'profile.normal': 'Normal', 'profile.glass': 'Vidro', 'nav.home': 'Início', 'nav.history': 'Histórico', 'nav.settings': 'Ajustes', 'settings.title': 'Configurações', 'settings.volume': 'Volume', 'settings.muted': 'Sem som',
  'settings.effects': 'Efeitos de tela', 'settings.effectsSub': 'Raios, faíscas e clarões',
  'settings.on': 'Ligado', 'settings.off': 'Desligado', 'settings.language': 'Idioma',
  'settings.durations': 'Duração de cada sorteio', 'settings.fixed': 'Fixo', 'settings.random': 'Aleatório', 'settings.durationsSub': 'De 5 a 60 s (moeda: 3 a 5 s). Dados fixos; bomba aleatória', 'settings.sec': '{n} s',
  'a11y.back': 'Voltar', 'a11y.settings': 'Configurações', 'welcome.title': 'Boas-vindas ao Flash Random!', 'welcome.question': 'Você tem alguma deficiência ou dificuldade para usar o app?', 'welcome.hint': 'Assim deixamos tudo do seu jeito. Você pode mudar isso depois em Configurações.', 'welcome.yes': 'SIM, QUERO AJUSTAR', 'welcome.no': 'NÃO, COMEÇAR', 'settings.a11y': 'Acessibilidade', 'settings.a11ySub': 'Ligue o que ajudar você', 'a11y.voice': 'Narração por voz', 'a11y.voiceSub': 'Fala os resultados e avisos em voz alta', 'a11y.bigText': 'Texto grande', 'a11y.bigTextSub': 'Aumenta todas as letras do app', 'a11y.contrast': 'Alto contraste', 'a11y.contrastSub': 'Texto branco e fundo mais escuro', 'a11y.calm': 'Reduzir movimento e clarões', 'a11y.calmSub': 'Sem raios, faíscas nem clarões de luz', 'a11y.marks': 'Cores com números', 'a11y.marksSub': 'Um número junto de cada cor (daltonismo)', 'a11y.haptics': 'Vibração', 'a11y.hapticsSub': 'Vibra nos momentos importantes', 'a11y.slow': 'Ritmo mais lento', 'a11y.slowSub': 'Nomes, roleta e corrida duram 50% a mais', 'a11y.bigTouch': 'Controles maiores', 'a11y.bigTouchSub': 'Barras e chaves maiores, mais fáceis de tocar', 'a11y.note': 'O leitor de tela do celular (TalkBack) também funciona em todo o app.',
};

const en = {
  'home.tagline': 'More than luck: the thrill of winning!',
  'home.title': 'Which draw do you want?',
  'home.history': 'HISTORY',
  'mode.names': 'Name draw', 'mode.roulette': 'Roulette', 'mode.dice': 'Dice', 'mode.race': 'Marble race', 'mode.sticks': 'Short straw',
  'modeSub.names': 'Lightning picks the winner',
  'modeSub.roulette': 'Spin and see who wins',
  'modeSub.dice': 'Highest number wins',
  'modeSub.race': 'First to arrive wins',

  'part.title': 'Who is taking part?',
  'part.sub': 'Add the names of everyone in the draw.',
  'part.sub.dice': 'Each participant gets a colored die (max. {max}).',
  'part.sub.race': 'Each participant becomes a colored marble (max. {max}).',
  'part.placeholder': 'Participant name',
  'part.add': 'ADD',
  'part.list': 'Participants',
  'part.empty': 'No participants yet. You need at least 2 to draw.',
  'part.warn.dice': 'For dice, remove names until {max} are left.',
  'part.warn.race': 'For the race, remove names until {max} are left.',
  'part.next': 'CONTINUE',
  'part.dupTitle': 'Duplicate name', 'part.dupMsg': 'This name is already on the list.',
  'part.clearTitle': 'Clear list', 'part.clearMsg': 'Remove all participants?',
  'part.cancel': 'Cancel', 'part.clear': 'Clear',

  'names.title': 'Drawing...', 'names.sub': 'The excitement is in the air!', 'names.info': 'Drawing among {n} participants',

  'roulette.sub': '{n} participants on the wheel', 'roulette.spin': 'SPIN', 'roulette.spinning': 'SPINNING...',

  'dice.idle': 'Everyone rolls one die. Highest number wins!',
  'dice.round': 'Round {n}', 'dice.tiebreak': 'Round {n} · tiebreak',
  'dice.hint': 'Tap the board to roll the dice!',
  'dice.colorHint': 'Hold your name to change your die color', 'dice.colorOf': 'Color for {name}', 'dice.colorSlide': 'Slide sideways and release', 'dice.roll': 'ROLL DICE',
  'dice.win': '{name} won with a {max}!', 'dice.tie': 'Tie at {max}! Tiebreak now!', 'dice.rounds': '{n} rounds',

  'race.idle': 'First to arrive wins. Watch out: lightning knocks you out!',
  'race.zap': '{name} was struck by lightning!',
  'race.ready': 'Get ready...', 'race.racing': 'They are off!', 'race.done': 'We have a champion!',
  'race.hint': 'Tap START to begin!', 'race.go': 'GO!', 'race.win': '{name} won the race!',
  'race.start': 'START!', 'race.readyBtn': 'GET READY...', 'race.running': 'RACING...',


  'mode.bomb': 'Time bomb', 'mode.coin': 'Heads or tails',
  'modeSub.bomb': 'Whoever holds the bomb is out', 'modeSub.coin': 'The coin decides between two',
  'part.sub.bomb': 'Everyone joins the bomb circle (max. {max}).', 'part.warn.bomb': 'For the bomb, remove names until {max} are left.',
  'part.sub.coin': 'Only 2 participants: the first is heads, the second is tails.', 'part.warn.coin': 'For heads or tails, keep only {max} participants.',
  'bomb.idle': 'The bomb goes from hand to hand. Whoever holds it when it blows is out!',
  'bomb.round': 'Round {n} · {k} left', 'bomb.hint': 'Tap to light the fuse!',
  'bomb.start': 'LIGHT THE FUSE', 'bomb.passing': 'PASSING...', 'bomb.over': 'THE END!',
  'bomb.boom': 'The bomb blew up on {name}!', 'bomb.win': '{name} survived!',
  'coin.idle': '{a} is heads, {b} is tails.', 'coin.hint': 'Tap the coin to flip it!',
  'coin.start': 'FLIP THE COIN', 'coin.flipping': 'FLIPPING...', 'coin.flipping2': 'Flipping...',
  'coin.heads': 'Heads', 'coin.tails': 'Tails', 'coin.result': '{face}! {name} wins!',

  'result.title': 'Draw result', 'result.champion': 'CHAMPION', 'result.label': 'And the winner is',
  'result.again': 'DRAW AGAIN', 'result.new': 'NEW DRAW',
  'share.button': 'SHARE', 'share.preparing': 'PREPARING...', 'share.title': 'Share result', 'share.error': 'Could not share right now.', 'share.participants': 'Participants ({n})',

  'history.title': 'History', 'history.sub': 'Your latest draws ({n} of 20)',
  'history.emptyTitle': 'No draws yet', 'history.emptySub': 'Run a draw and the champion shows up here.',

  'settings.profile': 'Profile', 'settings.profileSub': 'Pick the look of the home screen', 'profile.normal': 'Normal', 'profile.glass': 'Glass', 'nav.home': 'Home', 'nav.history': 'History', 'nav.settings': 'Settings', 'settings.title': 'Settings', 'settings.volume': 'Volume', 'settings.muted': 'Muted',
  'settings.effects': 'Screen effects', 'settings.effectsSub': 'Lightning, sparks and flashes',
  'settings.on': 'On', 'settings.off': 'Off', 'settings.language': 'Language',
  'settings.durations': 'Length of each draw', 'settings.fixed': 'Fixed', 'settings.random': 'Random', 'settings.durationsSub': '5 to 60 s (coin: 3 to 5 s). Dice fixed; bomb random', 'settings.sec': '{n} s',
  'a11y.back': 'Back', 'a11y.settings': 'Settings', 'welcome.title': 'Welcome to Flash Random!', 'welcome.question': 'Do you have a disability or any difficulty using the app?', 'welcome.hint': 'This way we set everything up for you. You can change it later in Settings.', 'welcome.yes': 'YES, ADJUST THE APP', 'welcome.no': 'NO, LET\'S START', 'settings.a11y': 'Accessibility', 'settings.a11ySub': 'Turn on whatever helps you', 'a11y.voice': 'Voice narration', 'a11y.voiceSub': 'Reads results and alerts out loud', 'a11y.bigText': 'Large text', 'a11y.bigTextSub': 'Makes all text in the app bigger', 'a11y.contrast': 'High contrast', 'a11y.contrastSub': 'White text and a darker background', 'a11y.calm': 'Reduce motion and flashes', 'a11y.calmSub': 'No lightning, sparks or light flashes', 'a11y.marks': 'Colors with numbers', 'a11y.marksSub': 'A number next to each color (color blindness)', 'a11y.haptics': 'Vibration', 'a11y.hapticsSub': 'Vibrates at important moments', 'a11y.slow': 'Slower pace', 'a11y.slowSub': 'Names, roulette and race last 50% longer', 'a11y.bigTouch': 'Larger controls', 'a11y.bigTouchSub': 'Bigger sliders and switches, easier to tap', 'a11y.note': 'The phone\'s screen reader (TalkBack) also works across the whole app.',
};

const es = {
  'home.tagline': 'Más que suerte, ¡es la emoción de ganar!',
  'home.title': '¿Qué sorteo quieres hacer?',
  'home.history': 'HISTORIAL',
  'mode.names': 'Sorteo de nombres', 'mode.roulette': 'Ruleta', 'mode.dice': 'Dados', 'mode.race': 'Carrera de canicas', 'mode.sticks': 'Palito corto',
  'modeSub.names': 'Los rayos eligen quién gana',
  'modeSub.roulette': 'Gira y descubre quién gana',
  'modeSub.dice': 'El número más alto gana',
  'modeSub.race': 'La primera en llegar gana',

  'part.title': '¿Quién va a participar?',
  'part.sub': 'Añade los nombres de quienes entran en el sorteo.',
  'part.sub.dice': 'Cada participante recibe un dado de color (máx. {max}).',
  'part.sub.race': 'Cada participante se convierte en una canica de color (máx. {max}).',
  'part.placeholder': 'Nombre del participante',
  'part.add': 'AÑADIR',
  'part.list': 'Participantes',
  'part.empty': 'Aún no hay participantes. Mínimo 2 para sortear.',
  'part.warn.dice': 'Para los dados, quita nombres hasta quedarte con {max} participantes.',
  'part.warn.race': 'Para la carrera, quita nombres hasta quedarte con {max} participantes.',
  'part.next': 'CONTINUAR',
  'part.dupTitle': 'Nombre repetido', 'part.dupMsg': 'Ese nombre ya está en la lista.',
  'part.clearTitle': 'Vaciar lista', 'part.clearMsg': '¿Quitar a todos los participantes?',
  'part.cancel': 'Cancelar', 'part.clear': 'Vaciar',

  'names.title': 'Sorteando...', 'names.sub': '¡La emoción ya está en el aire!', 'names.info': 'Sorteando entre {n} participantes',

  'roulette.sub': '{n} participantes en la ruleta', 'roulette.spin': 'GIRAR', 'roulette.spinning': 'GIRANDO...',

  'dice.idle': 'Cada persona tira un dado. ¡El número más alto gana!',
  'dice.round': 'Ronda {n}', 'dice.tiebreak': 'Ronda {n} · desempate',
  'dice.hint': '¡Toca el tablero para tirar los dados!',
  'dice.colorHint': 'Mantén pulsado tu nombre para cambiar el color', 'dice.colorOf': 'Color de {name}', 'dice.colorSlide': 'Desliza a los lados y suelta', 'dice.roll': 'TIRAR DADOS',
  'dice.win': '¡{name} ganó con un {max}!', 'dice.tie': '¡Empate con {max}! ¡Desempate ya!', 'dice.rounds': '{n} rondas',

  'race.idle': 'Gana quien llegue primero. ¡Cuidado: los rayos eliminan!',
  'race.zap': '¡A {name} le cayó un rayo!',
  'race.ready': 'En sus marcas...', 'race.racing': '¡En marcha!', 'race.done': '¡Fin de la carrera!',
  'race.hint': '¡Toca SALIDA para empezar!', 'race.go': '¡YA!', 'race.win': '¡{name} ganó la carrera!',
  'race.start': '¡SALIDA!', 'race.readyBtn': 'EN SUS MARCAS...', 'race.running': 'CORRIENDO...',


  'mode.bomb': 'Bomba de tiempo', 'mode.coin': 'Cara o cruz',
  'modeSub.bomb': 'Quien se quede con la bomba sale', 'modeSub.coin': 'La moneda decide entre dos',
  'part.sub.bomb': 'Todos entran en la ronda de la bomba (máx. {max}).', 'part.warn.bomb': 'Para la bomba, quita nombres hasta quedarte con {max} participantes.',
  'part.sub.coin': 'Solo 2 participantes: el primero es cara, el segundo es cruz.', 'part.warn.coin': 'Para cara o cruz, deja solo {max} participantes.',
  'bomb.idle': 'La bomba pasa de mano en mano. ¡Quien la tenga cuando estalle, sale!',
  'bomb.round': 'Ronda {n} · quedan {k}', 'bomb.hint': '¡Toca para encender la mecha!',
  'bomb.start': 'ENCENDER LA MECHA', 'bomb.passing': 'PASANDO...', 'bomb.over': '¡FIN!',
  'bomb.boom': '¡La bomba le estalló a {name}!', 'bomb.win': '¡{name} sobrevivió!',
  'coin.idle': '{a} es cara, {b} es cruz.', 'coin.hint': '¡Toca la moneda para lanzarla!',
  'coin.start': 'LANZAR LA MONEDA', 'coin.flipping': 'GIRANDO...', 'coin.flipping2': 'Girando...',
  'coin.heads': 'Cara', 'coin.tails': 'Cruz', 'coin.result': '¡Salió {face}! ¡{name} gana!',

  'result.title': 'Resultado del sorteo', 'result.champion': 'PRIMER LUGAR', 'result.label': 'La victoria es para',
  'result.again': 'SORTEAR DE NUEVO', 'result.new': 'NUEVO SORTEO',
  'share.button': 'COMPARTIR', 'share.preparing': 'PREPARANDO...', 'share.title': 'Compartir resultado', 'share.error': 'No se pudo compartir ahora.', 'share.participants': 'Participantes ({n})',

  'history.title': 'Historial', 'history.sub': 'Tus últimos sorteos ({n} de 20)',
  'history.emptyTitle': 'Aún no hay sorteos', 'history.emptySub': 'Haz un sorteo y el resultado aparecerá aquí.',

  'settings.profile': 'Perfil', 'settings.profileSub': 'Elige el estilo de la pantalla de inicio', 'profile.normal': 'Normal', 'profile.glass': 'Cristal', 'nav.home': 'Inicio', 'nav.history': 'Historial', 'nav.settings': 'Ajustes', 'settings.title': 'Ajustes', 'settings.volume': 'Volumen', 'settings.muted': 'Sin sonido',
  'settings.effects': 'Efectos de pantalla', 'settings.effectsSub': 'Rayos, chispas y destellos',
  'settings.on': 'Activado', 'settings.off': 'Desactivado', 'settings.language': 'Idioma',
  'settings.durations': 'Duración de cada sorteo', 'settings.fixed': 'Fijo', 'settings.random': 'Aleatorio', 'settings.durationsSub': 'De 5 a 60 s (moneda: 3 a 5 s). Dados fijos; bomba aleatoria', 'settings.sec': '{n} s',
  'a11y.back': 'Volver', 'a11y.settings': 'Ajustes', 'welcome.title': '¡Te damos la bienvenida a Flash Random!', 'welcome.question': '¿Tienes alguna discapacidad o dificultad para usar la app?', 'welcome.hint': 'Así dejamos todo a tu manera. Puedes cambiarlo después en Ajustes.', 'welcome.yes': 'SÍ, QUIERO AJUSTAR', 'welcome.no': 'NO, EMPEZAR', 'settings.a11y': 'Accesibilidad', 'settings.a11ySub': 'Activa lo que te ayude', 'a11y.voice': 'Narración por voz', 'a11y.voiceSub': 'Lee en voz alta los resultados y avisos', 'a11y.bigText': 'Texto grande', 'a11y.bigTextSub': 'Agranda todas las letras de la app', 'a11y.contrast': 'Alto contraste', 'a11y.contrastSub': 'Texto blanco y fondo más oscuro', 'a11y.calm': 'Reducir movimiento y destellos', 'a11y.calmSub': 'Sin rayos, chispas ni destellos de luz', 'a11y.marks': 'Colores con números', 'a11y.marksSub': 'Un número junto a cada color (daltonismo)', 'a11y.haptics': 'Vibración', 'a11y.hapticsSub': 'Vibra en los momentos importantes', 'a11y.slow': 'Ritmo más lento', 'a11y.slowSub': 'Nombres, ruleta y carrera duran un 50% más', 'a11y.bigTouch': 'Controles más grandes', 'a11y.bigTouchSub': 'Barras e interruptores más grandes, fáciles de tocar', 'a11y.note': 'El lector de pantalla del móvil (TalkBack) también funciona en toda la app.',
};

const de = {
  'home.tagline': 'Mehr als Glück: der Nervenkitzel des Gewinnens!',
  'home.title': 'Welche Auslosung möchtest du?',
  'home.history': 'VERLAUF',
  'mode.names': 'Namen auslosen', 'mode.roulette': 'Glücksrad', 'mode.dice': 'Würfel', 'mode.race': 'Murmelrennen', 'mode.sticks': 'Hölzchen ziehen',
  'modeSub.names': 'Der Blitz entscheidet',
  'modeSub.roulette': 'Dreh und sieh, wer gewinnt',
  'modeSub.dice': 'Die höchste Zahl gewinnt',
  'modeSub.race': 'Die erste im Ziel gewinnt',

  'part.title': 'Wer macht mit?',
  'part.sub': 'Füge die Namen aller Teilnehmer hinzu.',
  'part.sub.dice': 'Für jede Person ein farbiger Würfel (max. {max}).',
  'part.sub.race': 'Jede Person wird zu einer farbigen Murmel (max. {max}).',
  'part.placeholder': 'Name des Teilnehmers',
  'part.add': 'HINZUFÜGEN',
  'part.list': 'Teilnehmer',
  'part.empty': 'Noch keine Teilnehmer. Mindestens 2 zum Auslosen.',
  'part.warn.dice': 'Für die Würfel bitte Namen entfernen, bis {max} übrig sind.',
  'part.warn.race': 'Für das Rennen bitte Namen entfernen, bis {max} übrig sind.',
  'part.next': 'WEITER',
  'part.dupTitle': 'Name doppelt', 'part.dupMsg': 'Dieser Name steht schon auf der Liste.',
  'part.clearTitle': 'Liste leeren', 'part.clearMsg': 'Alle Teilnehmer entfernen?',
  'part.cancel': 'Abbrechen', 'part.clear': 'Leeren',

  'names.title': 'Auslosung läuft...', 'names.sub': 'Die Spannung liegt in der Luft!', 'names.info': 'Auslosung unter {n} Teilnehmern',

  'roulette.sub': '{n} Teilnehmer auf dem Rad', 'roulette.spin': 'DREHEN', 'roulette.spinning': 'DREHT SICH...',

  'dice.idle': 'Alle würfeln einmal. Die höchste Zahl gewinnt!',
  'dice.round': 'Runde {n}', 'dice.tiebreak': 'Runde {n} · Stechen',
  'dice.hint': 'Tippe auf das Brett zum Würfeln!',
  'dice.colorHint': 'Namen gedrückt halten, um die Farbe zu ändern', 'dice.colorOf': 'Farbe von {name}', 'dice.colorSlide': 'Zur Seite wischen und loslassen', 'dice.roll': 'WÜRFELN',
  'dice.win': '{name} gewinnt mit einer {max}!', 'dice.tie': 'Gleichstand mit {max}! Jetzt Stechen!', 'dice.rounds': '{n} Runden',

  'race.idle': 'Wer zuerst ankommt, gewinnt. Achtung: Blitze werfen dich raus!',
  'race.zap': '{name} wurde vom Blitz getroffen!',
  'race.ready': 'Achtung...', 'race.racing': 'Das Rennen läuft!', 'race.done': 'Das Rennen ist entschieden!',
  'race.hint': 'Tippe auf START, um loszulegen!', 'race.go': 'LOS!', 'race.win': '{name} hat das Rennen gewonnen!',
  'race.start': 'START!', 'race.readyBtn': 'ACHTUNG...', 'race.running': 'RENNEN LÄUFT...',


  'mode.bomb': 'Zeitbombe', 'mode.coin': 'Kopf oder Zahl',
  'modeSub.bomb': 'Wer die Bombe hält, fliegt raus', 'modeSub.coin': 'Die Münze entscheidet zu zweit',
  'part.sub.bomb': 'Alle kommen in den Bombenkreis (max. {max}).', 'part.warn.bomb': 'Für die Bombe bitte Namen entfernen, bis {max} übrig sind.',
  'part.sub.coin': 'Nur 2 Personen: die erste ist Kopf, die zweite ist Zahl.', 'part.warn.coin': 'Für Kopf oder Zahl bitte nur {max} Namen lassen.',
  'bomb.idle': 'Die Bombe wandert von Hand zu Hand. Wer sie beim Knall hält, fliegt raus!',
  'bomb.round': 'Runde {n} · noch {k}', 'bomb.hint': 'Tippe, um die Lunte zu zünden!',
  'bomb.start': 'LUNTE ZÜNDEN', 'bomb.passing': 'WANDERT...', 'bomb.over': 'ENDE!',
  'bomb.boom': 'Die Bombe ist bei {name} geplatzt!', 'bomb.win': '{name} hat überlebt!',
  'coin.idle': '{a} ist Kopf, {b} ist Zahl.', 'coin.hint': 'Tippe auf die Münze!',
  'coin.start': 'MÜNZE WERFEN', 'coin.flipping': 'DREHT SICH...', 'coin.flipping2': 'Dreht sich...',
  'coin.heads': 'Kopf', 'coin.tails': 'Zahl', 'coin.result': '{face}! {name} gewinnt!',

  'result.title': 'Ergebnis der Auslosung', 'result.champion': '1. PLATZ', 'result.label': 'Gewonnen hat',
  'result.again': 'NOCHMAL AUSLOSEN', 'result.new': 'NEUE AUSLOSUNG',
  'share.button': 'TEILEN', 'share.preparing': 'WIRD VORBEREITET...', 'share.title': 'Ergebnis teilen', 'share.error': 'Teilen ist gerade nicht möglich.', 'share.participants': 'Teilnehmende ({n})',

  'history.title': 'Verlauf', 'history.sub': 'Deine letzten Auslosungen ({n} von 20)',
  'history.emptyTitle': 'Noch keine Auslosungen', 'history.emptySub': 'Starte eine Auslosung und das Ergebnis erscheint hier.',

  'settings.profile': 'Profil', 'settings.profileSub': 'Wähle den Look des Startbildschirms', 'profile.normal': 'Normal', 'profile.glass': 'Glas', 'nav.home': 'Start', 'nav.history': 'Verlauf', 'nav.settings': 'Einstellungen', 'settings.title': 'Einstellungen', 'settings.volume': 'Lautstärke', 'settings.muted': 'Stumm',
  'settings.effects': 'Bildschirmeffekte', 'settings.effectsSub': 'Blitze, Funken und Lichtblitze',
  'settings.on': 'Ein', 'settings.off': 'Aus', 'settings.language': 'Sprache',
  'settings.durations': 'Dauer jeder Auslosung', 'settings.fixed': 'Fest', 'settings.random': 'Zufall', 'settings.durationsSub': '5 bis 60 s (Münze: 3 bis 5 s). Würfel fest; Bombe zufällig', 'settings.sec': '{n} s',
  'a11y.back': 'Zurück', 'a11y.settings': 'Einstellungen', 'welcome.title': 'Willkommen bei Flash Random!', 'welcome.question': 'Hast du eine Behinderung oder Schwierigkeiten bei der Nutzung der App?', 'welcome.hint': 'So richten wir alles für dich ein. Du kannst das später in den Einstellungen ändern.', 'welcome.yes': 'JA, ANPASSEN', 'welcome.no': 'NEIN, LOSLEGEN', 'settings.a11y': 'Barrierefreiheit', 'settings.a11ySub': 'Schalte ein, was dir hilft', 'a11y.voice': 'Sprachausgabe', 'a11y.voiceSub': 'Liest Ergebnisse und Hinweise laut vor', 'a11y.bigText': 'Große Schrift', 'a11y.bigTextSub': 'Macht alle Texte der App größer', 'a11y.contrast': 'Hoher Kontrast', 'a11y.contrastSub': 'Weißer Text und dunklerer Hintergrund', 'a11y.calm': 'Weniger Bewegung und Blitze', 'a11y.calmSub': 'Keine Blitze, Funken oder Lichteffekte', 'a11y.marks': 'Farben mit Zahlen', 'a11y.marksSub': 'Eine Zahl neben jeder Farbe (Farbenblindheit)', 'a11y.haptics': 'Vibration', 'a11y.hapticsSub': 'Vibriert bei wichtigen Momenten', 'a11y.slow': 'Langsameres Tempo', 'a11y.slowSub': 'Namen, Roulette und Rennen dauern 50 % länger', 'a11y.bigTouch': 'Größere Bedienelemente', 'a11y.bigTouchSub': 'Größere Regler und Schalter, leichter zu treffen', 'a11y.note': 'Der Screenreader des Handys (TalkBack) funktioniert ebenfalls in der ganzen App.',
};

export const DICT = { pt, en, es, de };

export function t(key, params) {
  const lang = getSettings().lang;
  let s = (DICT[lang] && DICT[lang][key]) || pt[key] || key;
  if (params) Object.keys(params).forEach((k) => { s = s.split(`{${k}}`).join(String(params[k])); });
  return s;
}

// código de idioma/região para datas e horas (ex.: 'pt-BR')
export const locale = () => LOCALES[getSettings().lang] || LOCALES.pt;
