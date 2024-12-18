import React, { useState, useCallback, useMemo } from 'react';
import PButton from '@/newComponents/PButton';
import './index.scss';
import PTooltip from '@/newComponents/PTooltip';

const Search: React.FC = () => {
  const handleStart = useCallback(() => {
    window.open('http://dev.primus.xyz/');
  }, []);
  return (
    <div className="dataSourceBanner">
      <div className="intro">
        <div className="title">Can’t find the data you need?</div>
        <div className="desc">
          <p>
            Use our Developer Hub to create more data verification templates and
            contribute to our community!
          </p>
        </div>
      </div>
      <PButton
        className="startBtn"
        text="Start now"
        type="secondary"
        size="s"
        onClick={handleStart}
      />
    </div>
  );
};

export default Search;
