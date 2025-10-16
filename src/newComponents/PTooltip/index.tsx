import React, { memo } from 'react';
import './index.scss';
interface PBackProps {
  children: any;
  title: string;
  placement?: string;
}
const PTooltip: React.FC<PBackProps> = memo(
  ({ children, placement = 'bottom', title }) => {
    return (
      <div className="PTooltip">
        {children}
        <div className="tooltip">
          <div>{title}</div></div>
      </div>
    );
  }
);

export default PTooltip;
