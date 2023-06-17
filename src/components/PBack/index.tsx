import React, { memo } from 'react';
import './index.sass';
interface PBackProps {
  onBack: () => void;
}
const PBack: React.FC<PBackProps> = memo(({ onBack }) => {
  return <div className="iconBack" onClick={onBack}></div>;
});

export default PBack;
