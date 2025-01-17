import React, { memo } from 'react';
import './index.scss';
const ExpiredTips = memo(() => {
  
  return <div className="originTip">
    <i className="iconfont icon-iconInfoColorful"></i>
    <p>
      All data displayed is fetched directly from network traffic using this
      Primus Extension.
    </p>
  </div>
});

export default ExpiredTips;
