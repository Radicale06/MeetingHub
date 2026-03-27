import React from 'react';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseClass = 'mh-btn';
  const variantClass = `mh-btn-${variant}`;
  const sizeClass = `mh-btn-${size}`;
  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClass} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
};
