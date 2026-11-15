import React from 'react';
import Svg, { Path, Circle, Rect, Polyline, Polygon } from 'react-native-svg';
import { ICONS } from '../iconData';

const TAGS = { path: Path, circle: Circle, rect: Rect, polyline: Polyline, polygon: Polygon };

// Ícone em SVG. name = chave de iconData.js; fill = true preenche todas as formas.
export default function Icon({ name, size = 24, color = '#FFFFFF', stroke = 2.6, fill = false }) {
  const shapes = ICONS[name] || [];
  return (
    <Svg
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round"
    >
      {shapes.map(({ t, f, ...rest }, i) => {
        const Shape = TAGS[t];
        return <Shape key={i} {...rest} fill={f || fill ? color : 'none'} />;
      })}
    </Svg>
  );
}
