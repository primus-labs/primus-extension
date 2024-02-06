import React, { memo } from 'react';
import './index.scss';
interface PBackProps {
  onBack: () => void;
}
const PBack: React.FC<PBackProps> = memo(({ onBack }) => {
  return (
    <div className="PBack">
      <i className="iconfont icon-DownArrow" onClick={onBack}></i>
    </div>
  );
});

export default PBack;
