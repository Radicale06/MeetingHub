import React from 'react';
import './Avatar.css';

interface AvatarProps {
  src?: string;
  fallback: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'offline' | 'busy';
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  fallback,
  size = 'md',
  className = '',
  status,
}) => {
  return (
    <div className={`mh-avatar-wrapper mh-avatar-${size} ${className}`.trim()}>
      {src ? (
        <img src={src} alt="Avatar" className="mh-avatar-img" />
      ) : (
        <div className="mh-avatar-fallback">{fallback}</div>
      )}
      {status && (
        <span className={`mh-avatar-status mh-avatar-status-${status}`} />
      )}
    </div>
  );
};
