import React from 'react';
import { cardStyles as s } from './Card.styles.ts';

export type CardVariant = keyof typeof s.variants;
export type CardPadding = keyof typeof s.paddings;

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  interactive?: boolean;
  as?: 'div' | 'section' | 'article' | 'button';
  type?: 'button' | 'submit' | 'reset';
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'md',
  interactive = false,
  as: Component = 'div',
  type,
  className = '',
  children,
  ...props
}) => {
  const effectivePadding = variant === 'quickNav' && padding === 'md' ? 'none' : padding;
  const combinedClassName = `${s.base} ${s.variants[variant]} ${s.paddings[effectivePadding]} ${
    interactive ? s.interactive : ''
  } ${className}`.trim();

  if (Component === 'button') {
    return (
      <button
        type={type || 'button'}
        className={combinedClassName}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }

  return (
    <Component className={combinedClassName} {...props}>
      {children}
    </Component>
  );
};
