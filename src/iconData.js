// Desenhos dos ícones (grade 24x24), em dados puros.
// t = tipo da forma; f = true significa "preenchida"; sem f, só contorno.
export const ICONS = {
  bolt: [{ t: 'polygon', points: '18.9,3.5 13.5,4.8 6.5,12.2 9.8,12.2 5.1,20.5 17.6,10.5 14.2,10.5', f: true }],

  wheel: [
    { t: 'circle', cx: 12, cy: 12, r: 9 },
    { t: 'circle', cx: 12, cy: 12, r: 2.2, f: true },
    { t: 'path', d: 'M12 3v6.8M12 14.2V21M3 12h6.8M14.2 12H21M5.6 5.6l4.8 4.8M13.6 13.6l4.8 4.8M18.4 5.6l-4.8 4.8M10.4 13.6l-4.8 4.8' },
  ],

  dice: [
    { t: 'rect', x: 3, y: 3, width: 18, height: 18, rx: 5 },
    { t: 'circle', cx: 8.2, cy: 8.2, r: 1.5, f: true },
    { t: 'circle', cx: 15.8, cy: 8.2, r: 1.5, f: true },
    { t: 'circle', cx: 12, cy: 12, r: 1.5, f: true },
    { t: 'circle', cx: 8.2, cy: 15.8, r: 1.5, f: true },
    { t: 'circle', cx: 15.8, cy: 15.8, r: 1.5, f: true },
  ],

  trophy: [
    { t: 'path', d: 'M7 3.5h10v6a5 5 0 0 1-10 0z' },
    { t: 'path', d: 'M7 5.5H3.8v1.8A3.2 3.2 0 0 0 7 10.5M17 5.5h3.2v1.8a3.2 3.2 0 0 1-3.2 3.2' },
    { t: 'path', d: 'M12 14.5V18M8 21h8M9.5 18h5' },
  ],

  share: [{ t: 'circle', cx: 18, cy: 5, r: 3 }, { t: 'circle', cx: 6, cy: 12, r: 3 }, { t: 'circle', cx: 18, cy: 19, r: 3 }, { t: 'path', d: 'M8.6 10.5l6.8-4M8.6 13.5l6.8 4' }],

  crown: [{ t: 'path', d: 'M3 8l4.5 4L12 4.5 16.5 12 21 8l-2 11H5z' }],

  users: [
    { t: 'circle', cx: 9, cy: 8, r: 3.5 },
    { t: 'path', d: 'M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6' },
    { t: 'circle', cx: 17.2, cy: 9, r: 2.5 },
    { t: 'path', d: 'M17.4 14c2.5 0 4.1 1.7 4.1 4.5' },
  ],

  volume: [
    { t: 'polygon', points: '4,9 8,9 13,5 13,19 8,15 4,15', f: true },
    { t: 'path', d: 'M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12' },
  ],
  mute: [
    { t: 'polygon', points: '4,9 8,9 13,5 13,19 8,15 4,15', f: true },
    { t: 'path', d: 'M17 9l5 6M22 9l-5 6' },
  ],

  plus: [{ t: 'path', d: 'M12 5v14M5 12h14' }],
  close: [{ t: 'path', d: 'M6 6l12 12M18 6L6 18' }],
  arrowRight: [{ t: 'path', d: 'M5 12h14M13 6l6 6-6 6' }],
  chevronLeft: [{ t: 'path', d: 'M15 5l-7 7 7 7' }],
  chevronRight: [{ t: 'path', d: 'M9 5l7 7-7 7' }],
  refresh: [
    { t: 'polyline', points: '23 4 23 10 17 10' },
    { t: 'path', d: 'M20.49 15a9 9 0 1 1-2.12-9.36L23 10' },
  ],
  tie: [{ t: 'path', d: 'M5 9h14M5 15h14' }],

  flag: [
    { t: 'path', d: 'M5 21V3' },
    { t: 'path', d: 'M5 4h13l-3 4.2 3 4.2H5' },
  ],
  bomb: [
    { t: 'circle', cx: 10.5, cy: 14, r: 7 },
    { t: 'path', d: 'M15 8.6l2.2-2.2M17.2 6.4c.6-1.8 2-2.6 3.6-2.4' },
    { t: 'path', d: 'M7.4 12.4c.5-1.4 1.5-2.3 2.9-2.7' },
  ],
  coin: [
    { t: 'circle', cx: 12, cy: 12, r: 9 },
    { t: 'polygon', points: '14.6,7.2 11.4,8.0 8.1,12.1 10.0,12.1 7.4,16.8 14.2,11.2 12.3,11.2', f: true, strokeWidth: 0.6 },
  ],
  sticks: [{ t: 'path', d: 'M6 3.5v17M12 3.5v10M18 3.5v14' }],
  home: [{ t: 'path', d: 'M4 11l8-7 8 7v8.5a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19.5z' }],
  // engrenagem com o raio do app no meio
  settings: [
    { t: 'path', d: 'M10.1 4.5L10.5 1.9L13.5 1.9L13.9 4.5L16.0 5.4L18.1 3.8L20.2 5.9L18.6 8.0L19.5 10.1L22.1 10.5L22.1 13.5L19.5 13.9L18.6 16.0L20.2 18.1L18.1 20.2L16.0 18.6L13.9 19.5L13.5 22.1L10.5 22.1L10.1 19.5L8.0 18.6L5.9 20.2L3.8 18.1L5.4 16.0L4.5 13.9L1.9 13.5L1.9 10.5L4.5 10.1L5.4 8.0L3.8 5.9L5.9 3.8L8.0 5.4Z' },
    { t: 'polygon', points: '15.9,7.2 12.8,8.0 8.9,12.1 10.8,12.1 8.1,16.8 15.1,11.2 13.2,11.2', f: true, strokeWidth: 0.8 },
  ],
  globe: [
    { t: 'circle', cx: 12, cy: 12, r: 9 },
    { t: 'path', d: 'M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18' },
  ],
  check: [{ t: 'path', d: 'M5 12.5l4.5 4.5L19 7.5' }],
  history: [
    { t: 'circle', cx: 12, cy: 12, r: 9 },
    { t: 'path', d: 'M12 7v5.2l3.6 2.2' },
  ],
};
