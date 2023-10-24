import React, { memo } from "react";
import type { SyntheticEvent } from 'react';
import "./index.scss";

interface PButtonProps {
  prefix?: any;
  suffix?: any;
  text: string;
  onClick: () => void;
}
const PButton: React.FC<PButtonProps> = memo(
  ({ prefix, suffix, text, onClick }) => {
    const handleClick = (e: SyntheticEvent) => {
      e.stopPropagation();
      onClick && onClick();
    };
    return (
      <button className="pButton" onClick={handleClick}>
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
