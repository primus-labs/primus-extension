import React, { useState, useEffect } from 'react';
import '../index.sass';
interface IconProps {
  color?: string;
  hoverColor?: string;
  width?: string;
}

const IconClear: React.FC<IconProps> = ({
  color = '#0A1214',
  hoverColor = '#fff',
  width = '28',
}) => {
  const [strokeColor, setStrokeColor] = useState<string>();
  useEffect(() => {
    setStrokeColor(color);
  }, [color]);
  const handleEnter = () => {
    hoverColor && setStrokeColor(hoverColor);
  };
  const handleLeave = () => {
    setStrokeColor(color);
  };
  return (
    <svg
      width={width}
      height={width}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clip-path="url(#clip0_50_1711)">
        <path
          d="M21.5623 14.6667L14.4103 7.51467L16.2957 5.62933L26.6663 16L16.2957 26.3707L14.4103 24.4853L21.5623 17.3333H5.33301V14.6667H21.5623Z"
          fill={strokeColor}
        />
      </g>
      <defs>
        <clipPath id="clip0_50_1711">
          <rect width={width} height={width} fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export default IconClear;
