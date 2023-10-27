import React, { memo } from 'react';
import './index.scss';
interface PBackProps {
  onBack: () => void;
}
const PBack: React.FC<PBackProps> = memo(({ onBack }) => {
  return (
    <div className="pBack">
      <i className="iconfont icon-iconArrowLeft2" onClick={onBack}></i>
    </div>
  );
});

export default PBack;
