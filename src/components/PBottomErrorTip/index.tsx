import React from 'react';
import './index.sass';
interface PBottomErrorTipProps {
  text: string;
}
const PBottomErrorTip: React.FC<PBottomErrorTipProps> = ({ text }) => {
  return (
    <div className="tipWrapper">
      <div className="errorTip">{text}</div>
    </div>
  );
};

export default PBottomErrorTip;
