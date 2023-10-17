import React, { memo } from "react";
import type {MouseEvent} from 'react'
import "./index.scss";

interface PButtonProps {
  prefix?: any;
  suffix?: any;
  text: string;
  onClick: () => void;
}
const PButton: React.FC<PButtonProps> = memo(
  ({ prefix, suffix, text, onClick }) => {
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick && onClick();
    };
    return (
      <button className="pButton" onClick={handleClick}>
        {prefix && <img className="prefix" src={prefix} alt="" />}
        <span className="btnText">{text}</span>
        {suffix && <img className="suffix" src={suffix} alt="" />}
      </button>
    );
  }
);

export default PButton;
