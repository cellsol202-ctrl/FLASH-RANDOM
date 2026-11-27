import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect, Ellipse } from 'react-native-svg';
import { lookOf, WheelRing, WheelBezel, bezelGeom, IMG } from './WheelArt';

// Miniaturas do menu de estilos (roleta e dados). Só traços e cores lisas (sem degradês),
// então várias miniaturas na mesma tela não se confundem entre si.

const SLICES = ['#FF4D6D', '#FFC93C', '#3DDC84', '#42A5FF', '#B06CFF', '#FF8A3D'];
const polar = (c, deg, r) => {
  const a = (deg * Math.PI) / 180;
  return `${(c + r * Math.sin(a)).toFixed(2)} ${(c - r * Math.cos(a)).toFixed(2)}`;
};

// Roleta: fatias coloridas + o aro do estilo (o mesmo desenho da roda, em ponto pequeno) + centro
export function WheelThumb({ look: name, size = 36 }) {
  const look = lookOf(name);
  if (look && look.image) {
    // estilo de imagem: fatias lisas por baixo e a imagem do aro (versão pequena) por cima
    const g = bezelGeom(size);
    const r = IMG.vis * 0.97 * g.s;
    const pp = (deg) => { const a = (deg * Math.PI) / 180; return `${(g.hub.x + r * Math.sin(a)).toFixed(2)} ${(g.hub.y - r * Math.cos(a)).toFixed(2)}`; };
    return (
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
          {SLICES.map((col, i) => (
            <Path key={i} d={`M ${g.hub.x} ${g.hub.y} L ${pp(i * 60)} A ${r} ${r} 0 0 1 ${pp((i + 1) * 60)} Z`} fill={col} />
          ))}
        </Svg>
        <WheelBezel size={size} mini />
      </View>
    );
  }
  const c = size / 2;
  // o aro de verdade é fino demais para 36 px: nas miniaturas ele fica mais grosso
  const big = look && {
    ...look,
    rim: look.rim * 1.9,
    outer: { ...look.outer, w: look.outer.w * 1.8 },
    inner: { ...look.inner, w: look.inner.w * 1.8 },
  };
  const rim = look ? (big.rim * size) / 380 : 4.6;
  const r = c - rim - 1;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        {SLICES.map((col, i) => (
          <Path key={i} d={`M ${c} ${c} L ${polar(c, i * 60, r)} A ${r} ${r} 0 0 1 ${polar(c, (i + 1) * 60, r)} Z`} fill={col} />
        ))}
        {!look && (
          <>
            <Circle cx={c} cy={c} r={c - 2.3} fill="none" stroke="#2A7CFF" strokeWidth={4.6} />
            <Circle cx={c} cy={c} r={c - 0.9} fill="none" stroke="#BDEBFF" strokeWidth={1.4} />
            <Circle cx={c} cy={c} r={c - 4.6} fill="none" stroke="#BDEBFF" strokeWidth={1.4} />
          </>
        )}
      </Svg>
      {look && <WheelRing size={size} look={big} />}
      <Svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Circle cx={c} cy={c} r={size * 0.1} fill={look ? look.hub.ring[1] : '#FFD84A'} stroke="#11134C" strokeWidth={1.2} />
      </Svg>
    </View>
  );
}

const PIPS = [[12, 12], [28, 12], [20, 20], [12, 28], [28, 28]]; // cinco

// Dado visto de frente, no estilo escolhido
export function DiceThumb({ look = 'plastic', size = 36 }) {
  const body = '#3DA5FF';
  const face = { x: 4.5, y: 4.5, width: 31, height: 31, rx: 9 };
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      {look === 'neon' && (
        <>
          <Rect {...face} fill="#0A1445" />
          <Rect {...face} fill="none" stroke="#5CD6FF" strokeOpacity={0.22} strokeWidth={6} />
          <Rect {...face} fill="none" stroke="#5CD6FF" strokeOpacity={0.5} strokeWidth={3.6} />
          <Rect {...face} fill="none" stroke="#BDF3FF" strokeWidth={1.8} />
          {PIPS.map(([x, y], i) => (
            <React.Fragment key={i}>
              <Circle cx={x} cy={y} r={4.6} fill="#5CD6FF" fillOpacity={0.25} />
              <Circle cx={x} cy={y} r={2.6} fill="#FFFFFF" />
            </React.Fragment>
          ))}
        </>
      )}
      {look === 'cartoon' && (
        <>
          <Rect {...face} fill={body} stroke="#0A1445" strokeWidth={4} />
          <Ellipse cx={14} cy={11} rx={8} ry={3.4} fill="#FFFFFF" fillOpacity={0.75} />
          {PIPS.map(([x, y], i) => (
            <React.Fragment key={i}>
              <Circle cx={x + 0.8} cy={y + 1.2} r={3} fill="#0A1445" fillOpacity={0.55} />
              <Circle cx={x} cy={y} r={2.9} fill="#FFFFFF" />
            </React.Fragment>
          ))}
        </>
      )}
      {look === 'gold' && (
        <>
          <Rect {...face} fill={body} stroke="#B97A0C" strokeWidth={3.4} />
          <Rect x={6.6} y={6.6} width={26.8} height={26.8} rx={7} fill="none" stroke="#FFE28F" strokeWidth={1.2} />
          <Ellipse cx={15} cy={11} rx={7} ry={2.8} fill="#FFFFFF" fillOpacity={0.5} />
          {PIPS.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.8} fill="#FFFFFF" />)}
        </>
      )}
      {look !== 'neon' && look !== 'cartoon' && look !== 'gold' && (
        <>
          <Rect {...face} fill={body} stroke="#1B63C4" strokeWidth={2} />
          <Ellipse cx={15} cy={11} rx={8} ry={3} fill="#FFFFFF" fillOpacity={0.45} />
          {PIPS.map(([x, y], i) => <Circle key={i} cx={x} cy={y} r={2.8} fill="#FFFFFF" />)}
        </>
      )}
    </Svg>
  );
}
