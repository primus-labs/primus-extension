import React, { useState, useEffect } from 'react';
import '../index.scss';

interface IconProps {
  color?: string;
  hoverColor?: string;
  width?: string;
}

const IconDownload: React.FC<IconProps> = ({
  color = '#939393',
  hoverColor = '#313131',
  width = '24',
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
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <path
        d="M9 11V17M9 17L11 15M9 17L7 15"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 10V15C22 20 20 22 15 22H9C4 22 2 20 2 15V9C2 4 4 2 9 2H14"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M22 10H18C15 10 14 9 14 6V2L22 10Z"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default IconDownload;
