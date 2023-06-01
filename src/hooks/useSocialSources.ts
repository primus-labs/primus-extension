import React, { useState, useEffect, useCallback } from 'react';
import { DATASOURCEMAP } from '@/config/constants';

export type DataSourceStorages = {
  [propName: string]: any;
};
type SocialDataMap = {
  [propName: string]: any;
};
const useSocialSources = () => {
  const [socialDataSourceMap, setSocialDataSourceMap] =
    useState<SocialDataMap>();
  const getSocialDatas = useCallback(async () => {
    const sourceNameList = Object.keys(DATASOURCEMAP).filter(
      (i) => DATASOURCEMAP[i].type === 'Social'
    );
    const res: DataSourceStorages = await chrome.storage.local.get(
      sourceNameList
    );
    const reduceF = (prev: any, curr: string) => {
      const sourceData = JSON.parse(res[curr]);
      prev[curr] = {
        ...DATASOURCEMAP[curr],
        ...sourceData,
      };
      return prev;
    };
    const datasMap = Object.keys(res).reduce(reduceF, {});
    setSocialDataSourceMap(datasMap);
  }, []);
  useEffect(() => {
    getSocialDatas();
  }, [getSocialDatas]);
  return [socialDataSourceMap, getSocialDatas];
};

export default useSocialSources;
