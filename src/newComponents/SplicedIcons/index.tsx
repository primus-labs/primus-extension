import React, { memo, useMemo } from 'react';
import './index.scss';
interface PBackProps {
  list: any[];
  max?: number;
}
const SplicedIcons: React.FC<PBackProps> = memo(({ list, max = 5 }) => {
  const formatList = useMemo(() => {
    const newList = list.slice(0, max);
    return newList;
  }, [list, max]);
  return (
    <div className="splicedIcons">
      {formatList.map((i, k) => {
        return <img src={i} alt="" key={k} />;
      })}
      {list.length > max && (
        <div className="hideCircle">+{list.length - formatList.length}</div>
      )}
    </div>
  );
});

export default SplicedIcons;
