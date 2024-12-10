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
        <div className="title">
          Didn't find the data source you want to connect?
        </div>
        <div className="desc">
          <p>
            {' '}
            Become a developer and contribute to our community! Use our data
            source templates to develop your own solution stacks.
          </p>
          <p>
            Connect more Real World Assets and data to fulfill Web3 ecosystems.
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
