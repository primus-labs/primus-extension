import React, { memo } from 'react';
import './index.scss';
interface PBackProps {
  list: any[];
}
const SplicedIcons: React.FC<PBackProps> = memo(({ list }) => {
  return (
    <div className="splicedIcons">
      {list.map((i, k) => {
        return <img src={i} alt="" key={k} />;
      })}
    </div>
  );
});

export default SplicedIcons;
