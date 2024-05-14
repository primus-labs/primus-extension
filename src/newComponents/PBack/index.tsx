import React, { memo } from 'react';
import './index.scss';
import PButton from '@/newComponents/PButton';
interface PBackProps {
  onBack: () => void;
  withLabel?: boolean;
  label?: string;
}
const PBack: React.FC<PBackProps> = memo(
  ({ onBack, withLabel = false, label = 'Back' }) => {
    return (
      <div className="PBack" onClick={onBack}>
        <PButton
          icon={<i className="iconfont icon-DownArrow"></i>}
          type="icon"
          onClick={onBack}
        />
        {withLabel && <span>{label}</span>}
      </div>
    );
  }
);

export default PBack;
