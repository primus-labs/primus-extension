import React, { memo, useCallback, useEffect, useState, useMemo } from 'react';
import Table from './Table';
import './index.scss';

const AssetsDetails = memo(() => {
  return (
    <div className="socialDetails">
      <div className="title">
        <span>Social Details</span>
      </div>
      <div className="content">
        <Table />
      </div>
    </div>
  );
});

export default AssetsDetails;
