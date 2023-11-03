import React, { useState, useEffect } from 'react';
import '../index.scss';
interface IconProps {
  color?: string;
  hoverColor?: string;
  width?: string;
  onClick?: () => void;
}

const IconFilter: React.FC<IconProps> = ({
  color = '#A7AAAA',
  hoverColor = '#6C7172',
  width = '12',
  onClick,
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
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onClick={onClick}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.4403 9.82008H10.0736M11.2536 8.66675V11.0334M14.4203 9.83341C14.4203 10.4267 14.2536 10.9867 13.9603 11.4667C13.6812 11.9355 13.2848 12.3234 12.8102 12.5922C12.3356 12.8611 11.7991 13.0017 11.2536 13.0001C10.7084 13.0003 10.1724 12.8592 9.69801 12.5904C9.22363 12.3217 8.82702 11.9345 8.54692 11.4667C8.24499 10.9755 8.08571 10.41 8.08692 9.83341C8.08692 8.08675 9.50692 6.66675 11.2536 6.66675C13.0003 6.66675 14.4203 8.08675 14.4203 9.83341Z"
          stroke={strokeColor}
          stroke-miterlimit="10"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          d="M13.7937 2.67992V4.15992C13.7937 4.69992 13.4537 5.37325 13.1204 5.71325L11.947 6.74659C11.7199 6.69255 11.4872 6.66569 11.2537 6.66659C9.50703 6.66659 8.08703 8.08659 8.08703 9.83325C8.08703 10.4266 8.2537 10.9866 8.54703 11.4666C8.7937 11.8799 9.1337 12.2333 9.54703 12.4866V12.7133C9.54703 13.1199 9.28036 13.6599 8.94036 13.8599L8.00036 14.4666C7.12703 15.0066 5.9137 14.3999 5.9137 13.3199V9.75325C5.9137 9.27992 5.64036 8.67325 5.3737 8.33992L2.8137 5.64659C2.48036 5.30659 2.20703 4.69992 2.20703 4.29992V2.74659C2.20703 1.93992 2.8137 1.33325 3.5537 1.33325H12.447C13.187 1.33325 13.7937 1.93992 13.7937 2.67992Z"
          stroke={strokeColor}
          stroke-miterlimit="10"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </svg>
  );
};

export default IconFilter;


