import React, { memo } from 'react';
import './index.scss';
interface PBackProps {
  onBack: () => void;
}
const PBack: React.FC<PBackProps> = memo(({ onBack }) => {
  return <i className="iconfont icon-iconArrowLeft2" onClick={onBack}></i>;
});

export default PBack;
