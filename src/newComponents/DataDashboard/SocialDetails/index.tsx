import React, { memo } from 'react';
import SocialTable from './SocialTable';
import './index.scss';

const AssetsDetails = memo(() => {
  return (
    <div className="socialDetails">
      <div className="title">
        <span>Social Details</span>
      </div>
      <div className="content">
        <SocialTable />
      </div>
    </div>
  );
});

export default AssetsDetails;
