import React from 'react';
import { buttonStyles as s } from './Button.styles.ts';

export type ButtonVariant = keyof typeof s.variants;
export type ButtonSize = keyof typeof s.sizes;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  target?: string;
  rel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leftIcon,
  rightIcon,
  href,
  target,
  rel,
  className = '',
  children,
  ...props
}) => {
  const combinedClassName = `${s.base} ${s.variants[variant]} ${s.sizes[size]} ${
    fullWidth ? s.fullWidth : ''
  } ${className}`.trim();

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={combinedClassName}
        onClick={props.onClick as unknown as React.MouseEventHandler<HTMLAnchorElement>}
        title={props.title}
        aria-label={props['aria-label']}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </a>
    );
  }

  return (
    <button className={combinedClassName} {...props}>
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
