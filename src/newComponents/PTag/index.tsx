import React, { memo, useMemo } from 'react';
import './index.scss';

interface PDropdownProps {
  text: string;
  onClick?: (value: any) => void;
  suffix?: any;
  color?: string; // yellow blue purple brand 
}

const PDropdown: React.FC<PDropdownProps> = memo(
  ({ text, color = 'yellow', onClick = () => {}, suffix }) => {
    const formatClassName = useMemo(() => {
      let cN = 'pTag';
      return (cN += ` ${color}`);
    }, [color]);
    return (
      <div className={formatClassName}>
        <span>{text}</span>
        {suffix}
      </div>
    );
  }
);

export default PDropdown;
