import React from 'react';

interface LoadingProps {
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({ size = 'medium', fullScreen = false }) => {
  const sizeClass = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  }[size];

  const containerClass = fullScreen ? 'fixed inset-0 flex items-center justify-center bg-white/80 z-50' : 'flex items-center justify-center';

  return (
    <div className={containerClass}>
      <div className={`animate-spin rounded-full border-4 border-primary border-t-transparent ${sizeClass}`} />
    </div>
  );
};