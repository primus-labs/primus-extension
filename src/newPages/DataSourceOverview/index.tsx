import React, { useState, useMemo, useCallback, useEffect, memo } from 'react';

import PInput from '@/newComponents/PInput';
import PSelect from '@/newComponents/PSelect';
import PButton from '@/newComponents/PButton';
import './index.scss';
const tList = [
  { label: 'Assets', value: '1' },
  { label: 'Social', value: '2' },
  { label: 'Identity', value: '3' },
];
const DataSourceOverview = memo(() => {
  const [dataSourceSearch, setDataSourceSearch] = useState<string>('');
  const [dataSourceType, setDataSourceType] = useState<string>('');
  const handleStart = useCallback(() => {}, []);
  return (
    <div className="pageDataSource">
      <div className="pageContent">
        <div className="friendlyTip">
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
          <PButton
            className="startBtn"
            text="Start now"
            type="secondary"
            size="s"
            onClick={handleStart}
          />
        </div>
        <div className="searchBar">
          <PInput
            className="serachStr"
            placeholder="Search data source name"
            type="text"
            onChange={(v) => {
              setDataSourceSearch(v);
            }}
            onSearch={(v) => {
              setDataSourceSearch(v);
            }}
            value={dataSourceSearch}
            prefix={<i className="iconfont icon-EyeOpen"></i>}
          />
          <PSelect
            className="serachType"
            placeholder="Select source type"
            list={tList}
            value={dataSourceType}
            onChange={(v) => {
              setDataSourceType(v);
            }}
            prefix={<i className="iconfont icon-EyeOpen"></i>}
          />
        </div>
      </div>
    </div>
  );
});

export default DataSourceOverview;
