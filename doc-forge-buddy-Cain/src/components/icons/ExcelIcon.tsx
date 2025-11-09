import React from 'react';

/**
 * Ícone Excel adaptado do SVG fornecido, usando Tailwind CSS
 */
export const ExcelIcon: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => {
  return (
    <svg
      width="19"
      height="21"
      viewBox="0 0 19 21"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      className={className}
    >
      <title>Group</title>
      <g
        id="Page-1"
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
      >
        <g id="Artboard" transform="translate(-142.000000, -122.000000)">
          <g id="Group" transform="translate(142.000000, 122.000000)">
            <path
              d="M3.4,4 L11.5,4 L11.5,4 L16,8.25 L16,17.6 C16,19.4777681 14.4777681,21 12.6,21 L3.4,21 C1.52223185,21 6.74049485e-16,19.4777681 0,17.6 L0,7.4 C2.14128934e-16,5.52223185 1.52223185,4 3.4,4 Z"
              id="Rectangle-Copy"
              fill="#C4FFE4"
            />
            <path
              d="M6.4,0 L12,0 L12,0 L19,6.5 L19,14.6 C19,16.4777681 17.4777681,18 15.6,18 L6.4,18 C4.52223185,18 3,16.4777681 3,14.6 L3,3.4 C3,1.52223185 4.52223185,7.89029623e-16 6.4,0 Z"
              id="Rectangle"
              fill="#85EBBC"
            />
            <path
              d="M12,0 L12,5.5 C12,6.05228475 12.4477153,6.5 13,6.5 L19,6.5 L19,6.5 L12,0 Z"
              id="Path-2"
              fill="#64B18D"
            />
          </g>
        </g>
      </g>
    </svg>
  );
};
