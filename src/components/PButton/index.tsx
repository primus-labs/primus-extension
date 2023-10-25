import React, { memo, useMemo } from 'react';
import type { SyntheticEvent } from 'react';
import "./index.scss";

interface PButtonProps {
  prefix?: any;
  suffix?: any;
  text: string;
  onClick: () => void;
  className?: string;
}
const PButton: React.FC<PButtonProps> = memo(
  ({ prefix, suffix, text, onClick, className }) => {
    const formatClassName = useMemo(() => {
      let defaultCN = 'pButton';
      if (className) {
        defaultCN += ' '+className;
      }
      
      return defaultCN;
    }, [className]);
    const handleClick = (e: SyntheticEvent) => {
      e.stopPropagation();
      onClick && onClick();
    };
    return (
      <button className={formatClassName} onClick={handleClick}>
        {/* {prefix && <img className="prefix" src={prefix} alt="" />} */}
        {prefix}
        <span className="btnText">{text}</span>
        {/* {suffix && <img className="suffix" src={suffix} alt="" />} */}
        {suffix}
      </button>
    );
  }
);

export default PButton;
