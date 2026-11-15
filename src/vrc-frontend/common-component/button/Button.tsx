import React from 'react';
import { Loader2 } from 'lucide-react';
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
  // Loading state (used by save buttons): shows a spinning loader in
  // place of the left icon and disables the button until the async
  // work finishes. The caller owns the boolean (its submitting/saving
  // state) and the label text (e.g. "Saving...").
  loading?: boolean;
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
  loading = false,
  disabled = false,
  className = '',
  children,
  ...props
}) => {
  const combinedClassName = `${s.base} ${s.variants[variant]} ${s.sizes[size]} ${
    fullWidth ? s.fullWidth : ''
  } ${className}`.trim();
  // While loading, the spinner replaces the left icon and the button is
  // disabled so a second tap cannot start a duplicate save.
  const resolvedLeftIcon = loading ? (
    <Loader2 className={s.loadingIcon} aria-hidden="true" />
  ) : (
    leftIcon
  );

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
        {resolvedLeftIcon}
        {children}
        {rightIcon}
      </a>
    );
  }

  return (
    <button className={combinedClassName} disabled={loading || disabled} {...props}>
      {resolvedLeftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
