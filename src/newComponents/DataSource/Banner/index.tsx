import React, { useState, useCallback, useMemo } from 'react';
import PButton from '@/newComponents/PButton';
import './index.scss'
import PTooltip from '@/newComponents/PTooltip';

const Search: React.FC = () => {
  const handleStart = useCallback(() => {}, []);
  return (
    <div className="dataSourceBanner">
      <div className="intro">
        <div className="title">
          Didn't find the data source you want to connect?
        </div>
        <div className="desc">
          Become a developer and contribute to our community! Use our data
          source templates to develop your own solution stacks. Connect more
          Real World Assets and data to fulfill Web3 ecosystems.
        </div>
      </div>
      <PTooltip title={`coming soon`}>
        <PButton
          className="startBtn"
          text="Start now"
          type="secondary"
          size="s"
          onClick={handleStart}
        />
      </PTooltip>
    </div>
  );
};

export default Search;
