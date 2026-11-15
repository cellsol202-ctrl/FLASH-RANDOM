import React from 'react';
import NeonButton from './NeonButton';

// Botão padrão do app (agora no estilo neon de vidro). Mantém a mesma API de antes:
// variant 'primary' | 'blue' = azul brilhante; 'indigo' | 'white' = escuro com borda neon.
// Os ícones recebem a cor branca automaticamente.
export default function Button({ title, onPress, variant = 'primary', disabled, icon, iconAfter }) {
  const tint = (el) => (React.isValidElement(el) ? React.cloneElement(el, { color: '#FFFFFF' }) : el);
  return (
    <NeonButton
      title={title}
      onPress={onPress}
      disabled={disabled}
      variant={variant === 'whats' ? 'whats' : variant === 'primary' || variant === 'blue' ? 'primary' : 'dark'}
      icon={tint(icon)}
      iconAfter={tint(iconAfter)}
    />
  );
}
