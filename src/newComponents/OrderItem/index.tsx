import React, { memo } from 'react';
import './index.scss';
interface PBackProps {
  order?: number|string;
  text?: string;
}
const PBack: React.FC<PBackProps> = memo(({ text,order=1, }) => {
  return (
    <div className="orderItem">
      <div className="order">{order}</div>
      <span>{text}</span>
    </div>
  );
});

export default PBack;
