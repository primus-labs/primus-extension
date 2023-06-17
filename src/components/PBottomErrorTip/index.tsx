import React, { memo } from 'react';
import './index.sass';
interface PBottomErrorTipProps {
  text: string;
}
const PBottomErrorTip: React.FC<PBottomErrorTipProps> = memo(({ text }) => {
  return (
    <div className="tipWrapper">
      <div className="errorTip">{text}</div>
    </div>
  );
});

export default PBottomErrorTip;
