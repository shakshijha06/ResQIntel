import React from 'react';

export const LogoMark = ({ className = "w-8 h-8", size = 32 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer Diamond Shield */}
      <rect
        x="16"
        y="2"
        width="19.799"
        height="19.799"
        rx="3"
        transform="rotate(45 16 2)"
        stroke="#F4EDE0"
        strokeWidth="1.5"
        strokeOpacity="0.4"
        fill="rgba(20, 33, 61, 0.8)"
      />
      {/* Concentric Signal Geometry */}
      <circle
        cx="16"
        cy="16"
        r="6.5"
        stroke="#FF6B58"
        strokeWidth="2"
        strokeDasharray="3 3"
      />
      {/* Central Solid Focal Pulse */}
      <circle
        cx="16"
        cy="16"
        r="3"
        fill="#FF6B58"
      />
      {/* Minimal Cardinal Coordinate Marks */}
      <line x1="16" y1="5.5" x2="16" y2="7.5" stroke="#F4EDE0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="24.5" x2="16" y2="26.5" stroke="#F4EDE0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5.5" y1="16" x2="7.5" y2="16" stroke="#F4EDE0" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="24.5" y1="16" x2="26.5" y2="16" stroke="#F4EDE0" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
