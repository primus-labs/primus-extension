import React, { useMemo, memo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import PControledInput from '@/components/PControledInput';
import PInput from '@/components/PInput';
import PSelect from '@/components/PSelect';

import type { UserState } from '@/types/store';

import type { Dispatch } from 'react';

import './index.scss';

const DataSourceSearch = memo(() => {
  const location = useLocation();
  const pathname = location.pathname;
  const exSources = useSelector((state: UserState) => state.exSources);
  const socialSources = useSelector((state: UserState) => state.socialSources);
  const kycSources = useSelector((state: UserState) => state.kycSources);
  const onChainAssetsSources = useSelector(
    (state: UserState) => state.onChainAssetsSources
  );
  const activeSourceType = useSelector(
    (state: UserState) => state.activeSourceType
  );
  const filterWord = useSelector((state: UserState) => state.filterWord);
  const credentials = useSelector((state: UserState) => state.credentials);
  const dispatch: Dispatch<any> = useDispatch();
  const dataSourceTypeList = useMemo(() => {
    let defaultList = [
      {
        value: 'All',
        text: 'All',
      },
    ];
    if (pathname === '/cred') {
      const credentialList = Object.values(credentials);
      const assetsProofList = credentialList.filter(
        (i) => i.type === 'ASSETS_PROOF'
      );
      const tokenHoldingsList = credentialList.filter(
        (i) => i.type === 'TOKEN_HOLDINGS'
      );
      const qualificationsList = credentialList.filter(
        (i) => i.type === 'IDENTIFICATION_PROOF'
      );
      if (assetsProofList.length > 0) {
        defaultList.push({
          value: 'Asset',
          text: 'Asset',
        });
      }
      if (tokenHoldingsList.length > 0) {
        defaultList.push({
          value: 'Token',
          text: 'Token',
        });
      }
      if (qualificationsList.length > 0) {
        defaultList.push({
          value: 'Identity',
          text: 'Identity',
        });
      }
    } else {
      if (
        (typeof exSources === 'object' &&
          Object.values(exSources).length > 0) ||
        Object.values(onChainAssetsSources).length > 0
      ) {
        defaultList.push({
          value: 'Assets',
          text: 'Assets',
        });
      }
      if (
        typeof socialSources === 'object' &&
        Object.values(socialSources).length > 0
      ) {
        defaultList.push({
          value: 'Social',
          text: 'Social',
        });
      }
      if (
        typeof kycSources === 'object' &&
        Object.values(kycSources).length > 0
      ) {
        defaultList.push({
          value: 'Identity',
          text: 'Identity',
        });
      }
    }
    return defaultList;
  }, [
    exSources,
    socialSources,
    kycSources,
    pathname,
    credentials,
    onChainAssetsSources,
  ]);
  const handleChangeSelect = (val: string) => {
    dispatch({
      type: 'setActiveSourceType',
      payload: val,
    });
  };
  const handleChangeInput = (val: string) => {
    dispatch({
      type: 'setFilterWord',
      payload: val,
    });
  };
  return (
    <div className="dataSourceSearch">
      <PSelect
        options={dataSourceTypeList}
        onChange={handleChangeSelect}
        val={activeSourceType}
        showSelf={false}
      />
      <div className="pSearch">
        <PInput
          onChange={handleChangeInput}
          type="text"
          placeholder="Search"
          value={filterWord}
        />
      </div>
    </div>
  );
});

export default DataSourceSearch;
