import React, { memo } from 'react';
import './index.sass';

const BackgroundAnimation = memo(() => {
  return (
    <div className="bgAnimation">
      <div className="backingBoard"></div>
    </div>
  );
});

export default BackgroundAnimation;
