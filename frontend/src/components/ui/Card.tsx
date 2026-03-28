import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick, hoverable = false, style }) => {
  const classes = `mh-card ${hoverable ? 'mh-card-hoverable' : ''} ${className}`.trim();

  return (
    <div className={classes} onClick={onClick} style={style}>
      {children}
    </div>
  );
};
