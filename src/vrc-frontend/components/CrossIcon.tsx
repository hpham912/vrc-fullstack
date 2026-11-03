import React from 'react';

interface CrossIconProps {
  className?: string;
  size?: number;
}

/**
 * Custom vector Cross icon for Vietnamese Revival Church.
 * Replaces unicode ✝ to prevent iOS from rendering it as an emoji emoticon.
 */
export const CrossIcon: React.FC<CrossIconProps> = ({ className = 'w-4 h-4', size }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-hidden="true"
    >
      {/* Elegant Christian Latin Cross */}
      <path
        d="M10.25 2.5C10.25 1.94772 10.6977 1.5 11.25 1.5H12.75C13.3023 1.5 13.75 1.94772 13.75 2.5V7H19.5C20.0523 7 20.5 7.44772 20.5 8V9.5C20.5 10.0523 20.0523 10.5 19.5 10.5H13.75V21.5C13.75 22.0523 13.3023 22.5 12.75 22.5H11.25C10.6977 22.5 10.25 22.0523 10.25 21.5V10.5H4.5C3.94772 10.5 3.5 10.0523 3.5 9.5V8C3.5 7.44772 3.94772 7 4.5 7H10.25V2.5Z"
        fill="currentColor"
      />
    </svg>
  );
};
