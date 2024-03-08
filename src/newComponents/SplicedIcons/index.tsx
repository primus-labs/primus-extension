import React, { memo, useMemo } from 'react';
import './index.scss';
interface PBackProps {
  list: any[];
}
const SplicedIcons: React.FC<PBackProps> = memo(({ list }) => {
  const formatList = useMemo(() => {
    const newList = list.slice(0, 5);
    return newList;
  }, [list]);
  return (
    <div className="splicedIcons">
      {formatList.map((i, k) => {
        return <img src={i} alt="" key={k} />;
      })}
      {list.length > 5 && (
        <div className="hideCircle">+{list.length - formatList.length}</div>
      )}
    </div>
  );
});

export default SplicedIcons;
