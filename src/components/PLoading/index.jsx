import React, { memo } from 'react';
import './index.sass';
const PLoading = memo(() => {
  return (
    <div className="pLoading">
      <div className="loader"></div>
    </div>
  );
});

export default PLoading;
